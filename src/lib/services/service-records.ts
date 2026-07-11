import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceRecord, ServiceRecordInsert, ServiceRecordUpdate, ApiResponse } from "@/lib/types";

/**
 * Service Records Service
 *
 * All Supabase queries for the service_records domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
 *
 * NOTE: Automatically syncs linked records in the "expenses" table.
 */

export async function getServiceRecords(
  supabase: SupabaseClient,
  vehicleId?: string
): Promise<ApiResponse<ServiceRecord[]>> {
  let query = supabase
    .from("service_records")
    .select("*")
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: data as ServiceRecord[], error: null };
}

export async function getServiceRecord(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<ServiceRecord>> {
  const { data, error } = await supabase
    .from("service_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ServiceRecord, error: null };
}

export async function createServiceRecord(
  supabase: SupabaseClient,
  userId: string,
  payload: ServiceRecordInsert
): Promise<ApiResponse<ServiceRecord>> {
  // ── Odometer guard ──────────────────────────────────────────────────────────
  // Fetch the vehicle's current odometer before inserting.
  const { data: vehicleRow, error: vehicleError } = await supabase
    .from("vehicles")
    .select("current_odometer")
    .eq("id", payload.vehicle_id)
    .single();

  if (vehicleError) return { data: null, error: vehicleError.message };

  const storedOdometer = vehicleRow?.current_odometer ?? 0;
  const newMileage = Number(payload.mileage);

  if (newMileage < storedOdometer) {
    return {
      data: null,
      error: `Mileage cannot be less than the vehicle's current odometer (${storedOdometer.toLocaleString()} km).`,
    };
  }

  // ── Insert service record ───────────────────────────────────────────────────
  const { data: record, error } = await supabase
    .from("service_records")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const serviceRecord = record as ServiceRecord;

  // ── Auto-update vehicle odometer if mileage advanced ───────────────────────
  if (newMileage > storedOdometer) {
    const { error: odoError } = await supabase
      .from("vehicles")
      .update({ current_odometer: newMileage })
      .eq("id", payload.vehicle_id);

    if (odoError) {
      console.error("Failed to update vehicle odometer after service record creation:", odoError.message);
    }
  }

  // ── Automatically create a linked expense record ────────────────────────────
  const { error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      vehicle_id: serviceRecord.vehicle_id,
      service_record_id: serviceRecord.id,
      category: "Service",
      title: serviceRecord.service_type,
      amount: serviceRecord.cost,
      expense_date: serviceRecord.service_date,
      mileage: serviceRecord.mileage,
      notes: serviceRecord.notes,
    });

  if (expenseError) {
    console.error("Failed to automatically sync expense for created service record:", expenseError.message);
  }

  return { data: serviceRecord, error: null };
}

export async function updateServiceRecord(
  supabase: SupabaseClient,
  id: string,
  payload: ServiceRecordUpdate
): Promise<ApiResponse<ServiceRecord>> {
  // ── Odometer guard (only when mileage is being updated) ─────────────────────
  if (payload.mileage !== undefined) {
    // We need the vehicle_id — fetch the existing service record first.
    const { data: existing, error: fetchError } = await supabase
      .from("service_records")
      .select("vehicle_id")
      .eq("id", id)
      .single();

    if (fetchError) return { data: null, error: fetchError.message };

    const { data: vehicleRow, error: vehicleError } = await supabase
      .from("vehicles")
      .select("current_odometer")
      .eq("id", existing.vehicle_id)
      .single();

    if (vehicleError) return { data: null, error: vehicleError.message };

    const storedOdometer = vehicleRow?.current_odometer ?? 0;
    const newMileage = Number(payload.mileage);

    if (newMileage < storedOdometer) {
      return {
        data: null,
        error: `Mileage cannot be less than the vehicle's current odometer (${storedOdometer.toLocaleString()} km).`,
      };
    }

    // ── Update the record ───────────────────────────────────────────────────────
    const { data: record, error } = await supabase
      .from("service_records")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    const serviceRecord = record as ServiceRecord;

    // ── Auto-update vehicle odometer if mileage advanced ─────────────────────
    if (newMileage > storedOdometer) {
      const { error: odoError } = await supabase
        .from("vehicles")
        .update({ current_odometer: newMileage })
        .eq("id", existing.vehicle_id);

      if (odoError) {
        console.error("Failed to update vehicle odometer after service record update:", odoError.message);
      }
    }

    // ── Sync linked expense ─────────────────────────────────────────────────────
    const { data: existingExpenses, error: findError } = await supabase
      .from("expenses")
      .select("id")
      .eq("service_record_id", id);

    if (!findError && existingExpenses && existingExpenses.length > 0) {
      const expenseId = existingExpenses[0].id;
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({
          vehicle_id: serviceRecord.vehicle_id,
          title: serviceRecord.service_type,
          amount: serviceRecord.cost,
          expense_date: serviceRecord.service_date,
          mileage: serviceRecord.mileage,
          notes: serviceRecord.notes,
        })
        .eq("id", expenseId);

      if (expenseError) {
        console.error("Failed to sync updated expense for service record:", expenseError.message);
      }
    } else {
      const { error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: serviceRecord.user_id,
          vehicle_id: serviceRecord.vehicle_id,
          service_record_id: serviceRecord.id,
          category: "Service",
          title: serviceRecord.service_type,
          amount: serviceRecord.cost,
          expense_date: serviceRecord.service_date,
          mileage: serviceRecord.mileage,
          notes: serviceRecord.notes,
        });

      if (expenseError) {
        console.error("Failed to create missing expense for updated service record:", expenseError.message);
      }
    }

    return { data: serviceRecord, error: null };
  }

  // ── Mileage not changing — normal update path ───────────────────────────────
  const { data: record, error } = await supabase
    .from("service_records")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const serviceRecord = record as ServiceRecord;

  // Find and update the linked expense record or create one if it doesn't exist
  const { data: existingExpenses, error: findError } = await supabase
    .from("expenses")
    .select("id")
    .eq("service_record_id", id);

  if (!findError && existingExpenses && existingExpenses.length > 0) {
    const expenseId = existingExpenses[0].id;
    const { error: expenseError } = await supabase
      .from("expenses")
      .update({
        vehicle_id: serviceRecord.vehicle_id,
        title: serviceRecord.service_type,
        amount: serviceRecord.cost,
        expense_date: serviceRecord.service_date,
        mileage: serviceRecord.mileage,
        notes: serviceRecord.notes,
      })
      .eq("id", expenseId);

    if (expenseError) {
      console.error("Failed to sync updated expense for service record:", expenseError.message);
    }
  } else {
    // Create new linked expense in case of legacy/missing link
    const { error: expenseError } = await supabase
      .from("expenses")
      .insert({
        user_id: serviceRecord.user_id,
        vehicle_id: serviceRecord.vehicle_id,
        service_record_id: serviceRecord.id,
        category: "Service",
        title: serviceRecord.service_type,
        amount: serviceRecord.cost,
        expense_date: serviceRecord.service_date,
        mileage: serviceRecord.mileage,
        notes: serviceRecord.notes,
      });

    if (expenseError) {
      console.error("Failed to create missing expense for updated service record:", expenseError.message);
    }
  }

  return { data: serviceRecord, error: null };
}

export async function deleteServiceRecord(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  // Automatically delete the linked expense record
  await supabase
    .from("expenses")
    .delete()
    .eq("service_record_id", id);

  const { error } = await supabase.from("service_records").delete().eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
