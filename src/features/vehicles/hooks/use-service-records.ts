import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServiceRecord, ServiceRecordInsert, ServiceRecordUpdate } from "@/lib/types";

/**
 * Hook to fetch all service records, optionally filtered by vehicle ID.
 * Query key: ["service-records"] or ["service-records", { vehicleId }]
 */
export function useServiceRecords(vehicleId?: string) {
  return useQuery<ServiceRecord[], Error>({
    queryKey: vehicleId ? ["service-records", { vehicleId }] : ["service-records"],
    queryFn: async () => {
      const url = vehicleId
        ? `/api/service-records?vehicleId=${encodeURIComponent(vehicleId)}`
        : "/api/service-records";
      const res = await fetch(url);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch service records");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch a single service record by ID.
 * Query key: ["service-record", id]
 */
export function useServiceRecord(id: string) {
  return useQuery<ServiceRecord, Error>({
    queryKey: ["service-record", id],
    queryFn: async () => {
      const res = await fetch(`/api/service-records/${id}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch service record");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new service record.
 * On success, invalidates queryKey: ["service-records"]
 */
export function useCreateServiceRecord() {
  const queryClient = useQueryClient();

  return useMutation<ServiceRecord, Error, ServiceRecordInsert>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to create service record");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-records"] });
      // Vehicle odometer may have been updated server-side — refresh vehicle cache.
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/**
 * Hook to update an existing service record.
 * On success, invalidates queryKey: ["service-records"] and ["service-record", id]
 */
export function useUpdateServiceRecord() {
  const queryClient = useQueryClient();

  return useMutation<ServiceRecord, Error, { id: string; payload: ServiceRecordUpdate }>({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/service-records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update service record");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-records"] });
      queryClient.invalidateQueries({ queryKey: ["service-record", variables.id] });
      // Vehicle odometer may have been updated server-side — refresh vehicle cache.
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/**
 * Hook to delete a service record.
 * On success, invalidates queryKey: ["service-records"]
 */
export function useDeleteServiceRecord() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/service-records/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to delete service record");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-records"] });
    },
  });
}
