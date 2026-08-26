/**
 * AutoLog AI Tool Definitions — server-side only.
 *
 * Each entry describes:
 *   1. `definition`  — the JSON Schema object registered with OpenRouter/OpenAI
 *                      so the model knows when and how to call the tool.
 *   2. `execute`     — the server-side function that runs the actual Supabase
 *                      query and returns serialisable data.
 *
 * SECURITY:
 *   - `userId` is ALWAYS sourced from the verified server-side auth session.
 *   - It is injected by the API route, never taken from model-generated args.
 *   - Supabase RLS provides an additional enforcement layer.
 *   - Model-supplied args are limited to: vehicleId, startDate, endDate, status, limit.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/* ─── Shared arg shapes ─── */

export interface ToolArgs {
  vehicleId?: string;
  startDate?: string; // ISO date string  e.g. "2026-01-01"
  endDate?: string;
  status?: string;
  limit?: number;
}

/* ─── OpenAI-compatible tool definition shape ─── */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/* ─── Tool executor type ─── */

export type ToolExecutor = (
  supabase: SupabaseClient,
  userId: string,   // always from server auth — never from model args
  args: ToolArgs
) => Promise<unknown>;

/* ─── Helper: compact vehicle label ─── */
function vehicleLabel(v: { make: string; model: string; year: number }): string {
  return `${v.year} ${v.make} ${v.model}`;
}

/* ════════════════════════════════════════════════════════════════════════════
   TOOL 1 — getVehicles
   ════════════════════════════════════════════════════════════════════════════ */

const getVehiclesDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "getVehicles",
    description:
      "Returns all vehicles that belong to the authenticated user. " +
      "Call this first when you need a list of vehicles or need to resolve a vehicle name to its ID.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

const executeGetVehicles: ToolExecutor = async (supabase, _userId, _args) => {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, year, variant, fuel_type, current_odometer, registration_number")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  return {
    vehicles: (data ?? []).map((v) => ({
      id: v.id,
      label: vehicleLabel(v),
      make: v.make,
      model: v.model,
      year: v.year,
      variant: v.variant,
      fuelType: v.fuel_type,
      currentOdometer: v.current_odometer,
      registrationNumber: v.registration_number,
    })),
    count: data?.length ?? 0,
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   TOOL 2 — getVehicleExpenses
   ════════════════════════════════════════════════════════════════════════════ */

const getVehicleExpensesDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "getVehicleExpenses",
    description:
      "Returns expense records for the user's vehicle. " +
      "Optionally filter by vehicleId (UUID), startDate, endDate (ISO date strings), and limit. " +
      "If vehicleId is omitted, returns expenses across all vehicles. " +
      "Results include category, amount, title, and date — useful for spending analysis.",
    parameters: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "UUID of the vehicle to filter by. Omit for all vehicles.",
        },
        startDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return expenses on or after this date.",
        },
        endDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return expenses on or before this date.",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default 30, max 100).",
        },
      },
      required: [],
    },
  },
};

const executeGetVehicleExpenses: ToolExecutor = async (supabase, _userId, args) => {
  const safeLimit = Math.min(args.limit ?? 30, 100);

  let query = supabase
    .from("expenses")
    .select("id, vehicle_id, category, title, amount, expense_date, notes, mileage")
    .order("expense_date", { ascending: false })
    .limit(safeLimit);

  if (args.vehicleId) query = query.eq("vehicle_id", args.vehicleId);
  if (args.startDate) query = query.gte("expense_date", args.startDate);
  if (args.endDate) query = query.lte("expense_date", args.endDate);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const expenses = data ?? [];
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  return {
    expenses: expenses.map((e) => ({
      id: e.id,
      vehicleId: e.vehicle_id,
      category: e.category,
      title: e.title,
      amount: Number(e.amount),
      date: e.expense_date,
      notes: e.notes,
      mileage: e.mileage,
    })),
    count: expenses.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   TOOL 3 — getFuelLogs
   ════════════════════════════════════════════════════════════════════════════ */

const getFuelLogsDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "getFuelLogs",
    description:
      "Returns fuel log records for the user's vehicle. " +
      "Optionally filter by vehicleId, startDate, endDate, and limit. " +
      "Results include liters, price per liter, total cost, and odometer — " +
      "useful for fuel efficiency and cost questions.",
    parameters: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "UUID of the vehicle to filter by. Omit for all vehicles.",
        },
        startDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return logs on or after this date.",
        },
        endDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return logs on or before this date.",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default 30, max 100).",
        },
      },
      required: [],
    },
  },
};

const executeGetFuelLogs: ToolExecutor = async (supabase, _userId, args) => {
  const safeLimit = Math.min(args.limit ?? 30, 100);

  let query = supabase
    .from("fuel_logs")
    .select("id, vehicle_id, log_date, liters, price_per_liter, total_cost, odometer, fuel_type, fuel_station, is_full_tank, notes")
    .order("log_date", { ascending: false })
    .limit(safeLimit);

  if (args.vehicleId) query = query.eq("vehicle_id", args.vehicleId);
  if (args.startDate) query = query.gte("log_date", args.startDate);
  if (args.endDate) query = query.lte("log_date", args.endDate);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const logs = data ?? [];
  const totalCost = logs.reduce((sum, l) => sum + Number(l.total_cost ?? 0), 0);
  const totalLiters = logs.reduce((sum, l) => sum + Number(l.liters ?? 0), 0);

  return {
    fuelLogs: logs.map((l) => ({
      id: l.id,
      vehicleId: l.vehicle_id,
      date: l.log_date,
      liters: Number(l.liters),
      pricePerLiter: Number(l.price_per_liter),
      totalCost: Number(l.total_cost),
      odometer: l.odometer,
      fuelType: l.fuel_type,
      station: l.fuel_station,
      isFullTank: l.is_full_tank,
      notes: l.notes,
    })),
    count: logs.length,
    totalCost: Math.round(totalCost * 100) / 100,
    totalLiters: Math.round(totalLiters * 100) / 100,
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   TOOL 4 — getServiceRecords
   ════════════════════════════════════════════════════════════════════════════ */

const getServiceRecordsDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "getServiceRecords",
    description:
      "Returns service/maintenance records for the user's vehicle. " +
      "Optionally filter by vehicleId, startDate, endDate, and limit. " +
      "Results include service type, date, cost, and mileage — " +
      "useful for maintenance history and cost analysis.",
    parameters: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "UUID of the vehicle to filter by. Omit for all vehicles.",
        },
        startDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return records on or after this date.",
        },
        endDate: {
          type: "string",
          description: "ISO date (YYYY-MM-DD). Only return records on or before this date.",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default 30, max 100).",
        },
      },
      required: [],
    },
  },
};

const executeGetServiceRecords: ToolExecutor = async (supabase, _userId, args) => {
  const safeLimit = Math.min(args.limit ?? 30, 100);

  let query = supabase
    .from("service_records")
    .select("id, vehicle_id, service_type, service_date, mileage, cost, notes, next_service_date, next_service_mileage")
    .order("service_date", { ascending: false })
    .limit(safeLimit);

  if (args.vehicleId) query = query.eq("vehicle_id", args.vehicleId);
  if (args.startDate) query = query.gte("service_date", args.startDate);
  if (args.endDate) query = query.lte("service_date", args.endDate);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const records = data ?? [];
  const totalCost = records.reduce((sum, r) => sum + Number(r.cost ?? 0), 0);

  return {
    serviceRecords: records.map((r) => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      serviceType: r.service_type,
      date: r.service_date,
      mileage: r.mileage,
      cost: Number(r.cost),
      notes: r.notes,
      nextServiceDate: r.next_service_date,
      nextServiceMileage: r.next_service_mileage,
    })),
    count: records.length,
    totalCost: Math.round(totalCost * 100) / 100,
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   TOOL 5 — getMaintenanceReminders
   ════════════════════════════════════════════════════════════════════════════ */

const getMaintenanceRemindersDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "getMaintenanceReminders",
    description:
      "Returns maintenance reminders for the user's vehicle. " +
      "Optionally filter by vehicleId, status (pending/completed/cancelled), and limit. " +
      "Results include title, due date, due odometer, and status — " +
      "useful for upcoming maintenance questions.",
    parameters: {
      type: "object",
      properties: {
        vehicleId: {
          type: "string",
          description: "UUID of the vehicle to filter by. Omit for all vehicles.",
        },
        status: {
          type: "string",
          enum: ["pending", "completed", "cancelled"],
          description: "Filter by reminder status. Omit for all statuses.",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default 30, max 100).",
        },
      },
      required: [],
    },
  },
};

const executeGetMaintenanceReminders: ToolExecutor = async (supabase, _userId, args) => {
  const safeLimit = Math.min(args.limit ?? 30, 100);

  let query = supabase
    .from("maintenance_reminders")
    .select("id, vehicle_id, title, description, reminder_type, due_date, due_odometer, status, created_at")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(safeLimit);

  if (args.vehicleId) query = query.eq("vehicle_id", args.vehicleId);
  if (args.status) query = query.eq("status", args.status);

  const { data, error } = await query;
  if (error) return { error: error.message };

  const today = new Date().toISOString().split("T")[0];
  const reminders = data ?? [];

  return {
    reminders: reminders.map((r) => {
      const isOverdue = r.due_date && r.due_date < today && r.status === "pending";
      return {
        id: r.id,
        vehicleId: r.vehicle_id,
        title: r.title,
        description: r.description,
        type: r.reminder_type,
        dueDate: r.due_date,
        dueOdometer: r.due_odometer,
        status: r.status,
        isOverdue: isOverdue ?? false,
        createdAt: r.created_at,
      };
    }),
    count: reminders.length,
    overdueCount: reminders.filter(
      (r) => r.due_date && r.due_date < today && r.status === "pending"
    ).length,
  };
};

/* ════════════════════════════════════════════════════════════════════════════
   REGISTRY — exported maps consumed by the chat API route
   ════════════════════════════════════════════════════════════════════════════ */

/** All tool definitions to register with the model */
export const AI_TOOL_DEFINITIONS: ToolDefinition[] = [
  getVehiclesDefinition,
  getVehicleExpensesDefinition,
  getFuelLogsDefinition,
  getServiceRecordsDefinition,
  getMaintenanceRemindersDefinition,
];

/** Map from tool name → executor function */
export const AI_TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  getVehicles: executeGetVehicles,
  getVehicleExpenses: executeGetVehicleExpenses,
  getFuelLogs: executeGetFuelLogs,
  getServiceRecords: executeGetServiceRecords,
  getMaintenanceReminders: executeGetMaintenanceReminders,
};

export type KnownToolName = keyof typeof AI_TOOL_EXECUTORS;
