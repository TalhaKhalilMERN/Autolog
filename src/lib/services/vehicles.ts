import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vehicle, VehicleInsert, ApiResponse } from "@/lib/types";

/**
 * Vehicles Service
 *
 * All Supabase queries for the vehicles domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership — no user_id filtering needed on reads.
 */

export async function listVehicles(
  supabase: SupabaseClient
): Promise<ApiResponse<Vehicle[]>> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as Vehicle[], error: null };
}

export async function getVehicle(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<Vehicle>> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Vehicle, error: null };
}

export async function createVehicle(
  supabase: SupabaseClient,
  userId: string,
  payload: VehicleInsert
): Promise<ApiResponse<Vehicle>> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Vehicle, error: null };
}

export async function updateVehicle(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<VehicleInsert>
): Promise<ApiResponse<Vehicle>> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Vehicle, error: null };
}

export async function deleteVehicle(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
