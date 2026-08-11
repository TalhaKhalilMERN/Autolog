import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vehicle, VehicleInsert, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/services/activities";

/**
 * Vehicles Service
 *
 * All Supabase queries for the vehicles domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * Automatically logs activities on CRUD events.
 */

export interface VehicleQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  fuelType?: string;
  sort?: "newest" | "oldest" | "name" | "odometer";
}

export interface PaginatedVehiclesResult {
  vehicles: Vehicle[];
  totalCount: number;
}

export async function listVehicles(
  supabase: SupabaseClient,
  options?: VehicleQueryOptions
): Promise<ApiResponse<Vehicle[] | PaginatedVehiclesResult>> {
  let query = supabase.from("vehicles").select("*", { count: "exact" });

  if (options?.fuelType && options.fuelType !== "all") {
    query = query.eq("fuel_type", options.fuelType);
  }

  if (options?.search && options.search.trim()) {
    const term = options.search.trim();
    query = query.or(
      `make.ilike.%${term}%,model.ilike.%${term}%,variant.ilike.%${term}%,registration_number.ilike.%${term}%`
    );
  }

  const sort = options?.sort || "newest";
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "name") {
    query = query.order("make", { ascending: true }).order("model", { ascending: true });
  } else if (sort === "odometer") {
    query = query.order("current_odometer", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (options?.page && options?.limit) {
    const from = (options.page - 1) * options.limit;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;

  if (error) return { data: null, error: error.message };

  if (options?.page && options?.limit) {
    return {
      data: {
        vehicles: (data as Vehicle[]) || [],
        totalCount: count ?? 0,
      },
      error: null,
    };
  }

  return { data: (data as Vehicle[]) || [], error: null };
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

  const vehicle = data as Vehicle;

  // Log activity
  await logActivity(supabase, {
    userId,
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "created",
    title: "Vehicle Added",
    description: `${vehicle.make} ${vehicle.model} (${vehicle.year}) was added to your garage.`,
    metadata: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registration_number,
      current_odometer: vehicle.current_odometer,
    },
    iconType: "vehicle",
  });

  return { data: vehicle, error: null };
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

  const vehicle = data as Vehicle;

  // Log activity
  await logActivity(supabase, {
    userId: vehicle.user_id,
    entityType: "vehicle",
    entityId: vehicle.id,
    action: "updated",
    title: "Vehicle Updated",
    description: `Updated details for ${vehicle.make} ${vehicle.model}.`,
    metadata: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    },
    iconType: "vehicle",
  });

  return { data: vehicle, error: null };
}

export async function deleteVehicle(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  // Fetch vehicle info before deletion for logging
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("user_id, make, model, year")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) return { data: null, error: error.message };

  if (vehicle) {
    await logActivity(supabase, {
      userId: vehicle.user_id,
      entityType: "vehicle",
      entityId: id,
      action: "deleted",
      title: "Vehicle Deleted",
      description: `Vehicle ${vehicle.make} ${vehicle.model} was removed from your garage.`,
      metadata: { make: vehicle.make, model: vehicle.model },
      iconType: "vehicle",
    });
  }

  return { data: { id }, error: null };
}
