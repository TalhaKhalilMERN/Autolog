import { useQuery } from "@tanstack/react-query";
import type { DashboardAnalyticsData } from "@/lib/services/analytics";

/**
 * Hook to fetch aggregated Dashboard Analytics data for charts.
 * Query Key: ["dashboard", "analytics"]
 * Cached for 5 minutes to minimize database load.
 */
export function useDashboardAnalytics() {
  return useQuery<DashboardAnalyticsData, Error>({
    queryKey: ["dashboard", "analytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/analytics");
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch dashboard analytics");
      }

      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
