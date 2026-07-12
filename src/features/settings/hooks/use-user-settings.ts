import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserSettings, UserSettingsUpdate } from "@/lib/types";

/**
 * Hook to fetch the authenticated user's settings.
 * Query key: ["user-settings"]
 */
export function useUserSettings() {
  return useQuery<UserSettings, Error>({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/user-settings");
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch settings");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to update the user's settings.
 * On success, invalidates queryKey: ["user-settings"]
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation<UserSettings, Error, UserSettingsUpdate>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/user-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update settings");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
  });
}
