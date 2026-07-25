import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/lib/types";

/**
 * Hook to fetch aggregated dashboard KPI stats.
 * Query key: ["dashboard-stats"]
 *
 * Consumed by the main dashboard page.
 * Invalidated by useCreateExpense, useDeleteExpense, useUpdateExpense,
 * useCreateReminder, useUpdateReminder, useDeleteReminder (already wired).
 */
export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch dashboard stats");
      }
      return (await res.json()).data;
    },
  });
}
