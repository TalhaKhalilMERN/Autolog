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

  // 2. Upcoming services count (next_service_date is today or in the future)
  const todayStr = new Date().toISOString().split("T")[0];
  const { count: upcomingServicesCount, error: upcomingError } = await supabase
    .from("service_records")
    .select("*", { count: "exact", head: true })
    .gte("next_service_date", todayStr);

  if (upcomingError) return { data: null, error: upcomingError.message };

  // 3. Total expenses — sourced from the expenses table (single source of truth)
  const { data: expenseData, error: expenseError } = await supabase
    .from("expenses")
    .select("amount");

  if (expenseError) return { data: null, error: expenseError.message };

  const totalExpenses = expenseData?.reduce((sum, row) => sum + Number(row.amount || 0), 0) ?? 0;

  // 4. This month expenses
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const { data: monthlyData, error: monthlyError } = await supabase
    .from("expenses")
    .select("amount")
    .gte("expense_date", firstOfMonth);

  if (monthlyError) return { data: null, error: monthlyError.message };

  const thisMonthExpenses = monthlyData?.reduce((sum, row) => sum + Number(row.amount || 0), 0) ?? 0;

  return {
    data: {
      vehicleCount: vehicleCount ?? 0,
      upcomingServicesCount: upcomingServicesCount ?? 0,
      totalExpenses,
      thisMonthExpenses,
    },
    error: null,
  };
}
