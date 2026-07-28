import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MaintenanceReminder,
  MaintenanceReminderInsert,
  MaintenanceReminderUpdate,
} from "@/lib/types";

/**
 * Hook to fetch all maintenance reminders, optionally filtered by vehicle ID.
 * Query key: ["reminders"] or ["reminders", { vehicleId }]
 */
export function useReminders(vehicleId?: string) {
  return useQuery<MaintenanceReminder[], Error>({
    queryKey: vehicleId ? ["reminders", { vehicleId }] : ["reminders"],
    queryFn: async () => {
      const url = vehicleId
        ? `/api/reminders?vehicleId=${encodeURIComponent(vehicleId)}`
        : "/api/reminders";
      const res = await fetch(url);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch reminders");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch a single maintenance reminder by ID.
 * Query key: ["reminder", id]
 */
export function useReminder(id: string) {
  return useQuery<MaintenanceReminder, Error>({
    queryKey: ["reminder", id],
    queryFn: async () => {
      const res = await fetch(`/api/reminders/${id}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch reminder");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new maintenance reminder.
 * On success, invalidates queryKey: ["reminders"]
 */
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation<MaintenanceReminder, Error, MaintenanceReminderInsert>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to create reminder");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

/**
 * Hook to update an existing maintenance reminder.
 * On success, invalidates queryKey: ["reminders"] and ["reminder", id]
 */
export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation<
    MaintenanceReminder,
    Error,
    { id: string; payload: MaintenanceReminderUpdate }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update reminder");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminder", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

/**
 * Hook to delete a maintenance reminder.
 * On success, invalidates queryKey: ["reminders"]
 */
export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to delete reminder");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
