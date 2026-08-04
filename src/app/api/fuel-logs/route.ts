import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFuelLogs, createFuelLog } from "@/lib/services/fuel-logs";
import { z } from "zod";

/**
 * GET /api/fuel-logs
 *
 * Returns all fuel logs belonging to the authenticated user.
 * Optional query parameter: vehicleId to filter by a specific vehicle.
 * Supabase RLS ensures only owned rows are returned.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId") || undefined;

  const result = await getFuelLogs(supabase, vehicleId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

const fuelLogInsertSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID"),
  log_date: z.string().min(1, "Date is required"),
  odometer: z.number().int().min(0, "Odometer must be non-negative"),
  liters: z.number().positive("Liters must be greater than 0"),
  price_per_liter: z.number().positive("Price per liter must be greater than 0"),
  total_cost: z.number().positive("Total cost must be greater than 0"),
  fuel_type: z.string().max(50).nullable().optional(),
  fuel_station: z.string().max(100).nullable().optional(),
  is_full_tank: z.boolean().optional().default(false),
  notes: z.string().max(1000).nullable().optional(),
});

/**
 * POST /api/fuel-logs
 *
 * Creates a new fuel log for the authenticated user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = fuelLogInsertSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ");
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const result = await createFuelLog(supabase, user.id, {
    vehicle_id: parsed.data.vehicle_id,
    log_date: parsed.data.log_date,
    odometer: parsed.data.odometer,
    liters: parsed.data.liters,
    price_per_liter: parsed.data.price_per_liter,
    total_cost: parsed.data.total_cost,
    fuel_type: parsed.data.fuel_type ?? null,
    fuel_station: parsed.data.fuel_station ?? null,
    is_full_tank: parsed.data.is_full_tank ?? false,
    notes: parsed.data.notes ?? null,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
