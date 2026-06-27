import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats, ApiResponse } from "@/lib/types";

/**
 * Dashboard Service
 *
 * Aggregated statistics queries for the dashboard home page.
 */

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<ApiResponse<DashboardStats>> {
  const { count, error } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  if (error) return { data: null, error: error.message };

  return {
    data: {
      vehicleCount: count ?? 0,
    },
    error: null,
  };
}
