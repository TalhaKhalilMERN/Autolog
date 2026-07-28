import { useQuery } from "@tanstack/react-query";
import type { ActivityEntityType, ActivityLog } from "@/lib/types";

export interface PaginatedActivitiesData {
  items: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UseActivitiesOptions {
  page?: number;
  limit?: number;
  entityType?: ActivityEntityType | "all";
}

/**
 * Hook to fetch paginated activity logs.
 * Query Key: ["activities", { page, limit, entityType }]
 */
export function useActivities(options: UseActivitiesOptions = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const entityType = options.entityType || "all";

  return useQuery<PaginatedActivitiesData, Error>({
    queryKey: ["activities", { page, limit, entityType }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        entityType,
      });

      const res = await fetch(`/api/activities?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch activities");
      }

      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch the latest N activities (e.g. for Dashboard widget).
 * Query Key: ["activities", "latest", limit]
 */
export function useLatestActivities(limit: number = 10) {
  return useQuery<ActivityLog[], Error>({
    queryKey: ["activities", "latest", limit],
    queryFn: async () => {
      const res = await fetch(`/api/activities?page=1&limit=${limit}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch latest activities");
      }

      const json = await res.json();
      return json.data?.items || [];
    },
  });
}
