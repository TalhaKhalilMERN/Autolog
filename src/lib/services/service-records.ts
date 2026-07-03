import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceRecord, ServiceRecordInsert, ServiceRecordUpdate, ApiResponse } from "@/lib/types";

/**
 * Service Records Service
 *
 * All Supabase queries for the service_records domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
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
  const { data, error } = await supabase
    .from("service_records")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ServiceRecord, error: null };
}

export async function updateServiceRecord(
  supabase: SupabaseClient,
  id: string,
  payload: ServiceRecordUpdate
): Promise<ApiResponse<ServiceRecord>> {
  const { data, error } = await supabase
    .from("service_records")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as ServiceRecord, error: null };
}

export async function deleteServiceRecord(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { error } = await supabase.from("service_records").delete().eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
