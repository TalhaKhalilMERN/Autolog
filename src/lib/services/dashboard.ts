import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardStats, ApiResponse } from "@/lib/types";

/**
 * Dashboard Service
 *
 * Single aggregated query that powers all KPI cards on the dashboard.
 * Runs in parallel to minimise latency.
 */
export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<ApiResponse<DashboardStats>> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  // Run all counts in parallel
  const [
    vehicleResult,
    serviceCountResult,
    expenseResult,
    monthlyExpenseResult,
    activeRemindersResult,
    overdueRemindersResult,
    upcomingRemindersResult,
  ] = await Promise.all([
    // 1. Vehicle count
    supabase.from("vehicles").select("*", { count: "exact", head: true }),

    // 2. Total service records
    supabase.from("service_records").select("*", { count: "exact", head: true }),

    // 3. All-time expense total
    supabase.from("expenses").select("amount"),

    // 4. This-month expenses
    supabase.from("expenses").select("amount").gte("expense_date", firstOfMonth),

    // 5. Active (pending) reminders
    supabase
      .from("maintenance_reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    // 6. Overdue reminders: pending + due_date < today
    supabase
      .from("maintenance_reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .not("due_date", "is", null)
      .lt("due_date", todayStr),

    // 7. Upcoming reminders: pending + due_date between today and today+7
    supabase
      .from("maintenance_reminders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("due_date", todayStr)
      .lte("due_date", in7DaysStr),
  ]);

  // Surface any errors
  for (const result of [
    vehicleResult,
    serviceCountResult,
    expenseResult,
    monthlyExpenseResult,
    activeRemindersResult,
    overdueRemindersResult,
    upcomingRemindersResult,
  ]) {
    if (result.error) return { data: null, error: result.error.message };
  }

  const totalExpenses =
    expenseResult.data?.reduce((sum, row) => sum + Number(row.amount || 0), 0) ?? 0;

  const thisMonthExpenses =
    monthlyExpenseResult.data?.reduce((sum, row) => sum + Number(row.amount || 0), 0) ?? 0;

  return {
    data: {
      vehicleCount: vehicleResult.count ?? 0,
      serviceRecordCount: serviceCountResult.count ?? 0,
      totalExpenses,
      thisMonthExpenses,
      activeRemindersCount: activeRemindersResult.count ?? 0,
      overdueRemindersCount: overdueRemindersResult.count ?? 0,
      upcomingRemindersCount: upcomingRemindersResult.count ?? 0,
    },
    error: null,
  };
}
