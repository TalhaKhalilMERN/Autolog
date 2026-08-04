import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FuelLog, FuelLogInsert, FuelLogUpdate } from "@/lib/types";

/**
 * Hook to fetch all fuel logs, optionally filtered by vehicle ID.
 * Query key: ["fuel-logs"] or ["fuel-logs", { vehicleId }]
 */
export function useFuelLogs(vehicleId?: string) {
  return useQuery<FuelLog[], Error>({
    queryKey: vehicleId ? ["fuel-logs", { vehicleId }] : ["fuel-logs"],
    queryFn: async () => {
      const url = vehicleId
        ? `/api/fuel-logs?vehicleId=${encodeURIComponent(vehicleId)}`
        : "/api/fuel-logs";
      const res = await fetch(url);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch fuel logs");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch a single fuel log by ID.
 * Query key: ["fuel-log", id]
 */
export function useFuelLog(id: string) {
  return useQuery<FuelLog, Error>({
    queryKey: ["fuel-log", id],
    queryFn: async () => {
      const res = await fetch(`/api/fuel-logs/${id}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch fuel log");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new fuel log.
 * On success, invalidates queryKey: ["fuel-logs"], ["vehicles"], ["activities"], and ["dashboard-stats"]
 */
export function useCreateFuelLog() {
  const queryClient = useQueryClient();

  return useMutation<FuelLog, Error, FuelLogInsert>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/fuel-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to create fuel log");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to update an existing fuel log.
 * On success, invalidates queryKey: ["fuel-logs"], ["fuel-log", id], ["vehicles"], ["activities"], and ["dashboard-stats"]
 */
export function useUpdateFuelLog() {
  const queryClient = useQueryClient();

  return useMutation<FuelLog, Error, { id: string; payload: FuelLogUpdate }>({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/fuel-logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update fuel log");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-log", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to delete a fuel log.
 * On success, invalidates queryKey: ["fuel-logs"], ["activities"], and ["dashboard-stats"]
 */
export function useDeleteFuelLog() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/fuel-logs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to delete fuel log");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
