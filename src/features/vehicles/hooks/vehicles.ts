import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Vehicle, VehicleInsert } from "@/lib/types";

/**
 * Hook to fetch all vehicles of the authenticated user.
 * Query key: ["vehicles"]
 */
export function useVehicles() {
  return useQuery<Vehicle[], Error>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch vehicles");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch a single vehicle by ID.
 * Query key: ["vehicle", id]
 */
export function useVehicle(id: string) {
  return useQuery<Vehicle, Error>({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${id}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch vehicle");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new vehicle.
 * On success, invalidates queryKey: ["vehicles"]
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation<Vehicle, Error, VehicleInsert>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to create vehicle");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/**
 * Hook to update an existing vehicle.
 * On success, invalidates queryKey: ["vehicles"] and ["vehicle", id]
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation<Vehicle, Error, { id: string; payload: Partial<VehicleInsert> }>({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update vehicle");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.id] });
    },
  });
}

/**
 * Hook to delete a vehicle.
 * On success, invalidates queryKey: ["vehicles"]
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to delete vehicle");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
