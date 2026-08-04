import type { SupabaseClient } from "@supabase/supabase-js";
import type { FuelLog, FuelLogInsert, FuelLogUpdate, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/services/activities";

/**
 * Fuel Logs Service
 *
 * All Supabase queries for the fuel_logs domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
 * Automatically logs activities on CRUD events.
 * Reuses the same odometer guard & vehicle mileage sync logic as Service Records.
 */

export async function getFuelLogs(
  supabase: SupabaseClient,
  vehicleId?: string
): Promise<ApiResponse<FuelLog[]>> {
  let query = supabase
    .from("fuel_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: data as FuelLog[], error: null };
}

export async function getFuelLog(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<FuelLog>> {
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as FuelLog, error: null };
}

export async function createFuelLog(
  supabase: SupabaseClient,
  userId: string,
  payload: FuelLogInsert
): Promise<ApiResponse<FuelLog>> {
  // ── Fetch vehicle info for odometer guard & logging ────────────────────────
  const { data: vehicleRow, error: vehicleError } = await supabase
    .from("vehicles")
    .select("make, model, current_odometer")
    .eq("id", payload.vehicle_id)
    .single();

  if (vehicleError) return { data: null, error: vehicleError.message };

  const storedOdometer = vehicleRow?.current_odometer ?? 0;
  const newOdometer = Number(payload.odometer);
  const vehicleName = `${vehicleRow.make} ${vehicleRow.model}`;

  // ── Insert fuel log ────────────────────────────────────────────────────────
  const { data: record, error } = await supabase
    .from("fuel_logs")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const fuelLog = record as FuelLog;

  // ── Auto-update vehicle odometer if it advanced ────────────────────────────
  if (newOdometer > storedOdometer) {
    const { error: odoError } = await supabase
      .from("vehicles")
      .update({ current_odometer: newOdometer })
      .eq("id", payload.vehicle_id);

    if (odoError) {
      console.error(
        "Failed to update vehicle odometer after fuel log creation:",
        odoError.message
      );
    }
  }

  // ── Log activity ───────────────────────────────────────────────────────────
  const costFormatted = `$${Number(fuelLog.total_cost).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;
  await logActivity(supabase, {
    userId,
    entityType: "fuel",
    entityId: fuelLog.id,
    action: "created",
    title: "Fuel Log Added",
    description: `${fuelLog.liters}L logged for ${vehicleName} at ${costFormatted}.`,
    metadata: {
      vehicle_name: vehicleName,
      liters: fuelLog.liters,
      total_cost: fuelLog.total_cost,
      odometer: fuelLog.odometer,
      fuel_type: fuelLog.fuel_type,
    },
    iconType: "fuel",
  });

  return { data: fuelLog, error: null };
}

export async function updateFuelLog(
  supabase: SupabaseClient,
  id: string,
  payload: FuelLogUpdate
): Promise<ApiResponse<FuelLog>> {
  // Fetch existing record to obtain vehicle_id and user_id for logging
  const { data: existing, error: fetchError } = await supabase
    .from("fuel_logs")
    .select("vehicle_id, user_id")
    .eq("id", id)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  // ── Odometer guard (only when odometer is being updated) ───────────────────
  if (payload.odometer !== undefined) {
    const { data: vehicleRow, error: vehicleError } = await supabase
      .from("vehicles")
      .select("current_odometer")
      .eq("id", existing.vehicle_id)
      .single();

    if (vehicleError) return { data: null, error: vehicleError.message };

    const storedOdometer = vehicleRow?.current_odometer ?? 0;
    const newOdometer = Number(payload.odometer);

    // ── Perform the update ─────────────────────────────────────────────────
    const { data: record, error } = await supabase
      .from("fuel_logs")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    const fuelLog = record as FuelLog;

    // ── Auto-update vehicle odometer if it advanced ──────────────────────
    if (newOdometer > storedOdometer) {
      const { error: odoError } = await supabase
        .from("vehicles")
        .update({ current_odometer: newOdometer })
        .eq("id", existing.vehicle_id);

      if (odoError) {
        console.error(
          "Failed to update vehicle odometer after fuel log update:",
          odoError.message
        );
      }
    }

    // Log activity
    await logActivity(supabase, {
      userId: fuelLog.user_id,
      entityType: "fuel",
      entityId: fuelLog.id,
      action: "updated",
      title: "Fuel Log Updated",
      description: `Updated fuel log — ${fuelLog.liters}L at ${fuelLog.odometer.toLocaleString()} km.`,
      metadata: {
        liters: fuelLog.liters,
        total_cost: fuelLog.total_cost,
        odometer: fuelLog.odometer,
      },
      iconType: "fuel",
    });

    return { data: fuelLog, error: null };
  }

  // ── Odometer not changing — normal update path ─────────────────────────────
  const { data: record, error } = await supabase
    .from("fuel_logs")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const fuelLog = record as FuelLog;

  await logActivity(supabase, {
    userId: fuelLog.user_id,
    entityType: "fuel",
    entityId: fuelLog.id,
    action: "updated",
    title: "Fuel Log Updated",
    description: `Updated fuel log — ${fuelLog.liters}L at ${fuelLog.odometer.toLocaleString()} km.`,
    metadata: {
      liters: fuelLog.liters,
      total_cost: fuelLog.total_cost,
      odometer: fuelLog.odometer,
    },
    iconType: "fuel",
  });

  return { data: fuelLog, error: null };
}

export async function deleteFuelLog(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  // Fetch details before delete for logging
  const { data: fuelLog } = await supabase
    .from("fuel_logs")
    .select("user_id, vehicle_id, liters, total_cost")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

  if (error) return { data: null, error: error.message };

  if (fuelLog) {
    await logActivity(supabase, {
      userId: fuelLog.user_id,
      entityType: "fuel",
      entityId: id,
      action: "deleted",
      title: "Fuel Log Deleted",
      description: `Removed fuel log of ${fuelLog.liters}L.`,
      metadata: { liters: fuelLog.liters, total_cost: fuelLog.total_cost },
      iconType: "fuel",
    });
  }

  return { data: { id }, error: null };
}
