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
  // 1. Vehicle count
  const { count: vehicleCount, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true });

  if (vehicleError) return { data: null, error: vehicleError.message };

  // 2. Upcoming services count (next_service_date is in the future or today)
  const todayStr = new Date().toISOString().split("T")[0];
  const { count: upcomingServicesCount, error: upcomingError } = await supabase
    .from("service_records")
    .select("*", { count: "exact", head: true })
    .gte("next_service_date", todayStr);

  if (upcomingError) return { data: null, error: upcomingError.message };

  // 3. Total expenses (sum of all service cost fields)
  const { data: costData, error: costError } = await supabase
    .from("service_records")
    .select("cost");

  if (costError) return { data: null, error: costError.message };

  const totalExpenses = costData?.reduce((sum, item) => sum + Number(item.cost || 0), 0) ?? 0;

  return {
    data: {
      vehicleCount: vehicleCount ?? 0,
      upcomingServicesCount: upcomingServicesCount ?? 0,
      totalExpenses,
    },
    error: null,
  };
}
