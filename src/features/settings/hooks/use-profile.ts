import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserProfile, UserProfileUpdate } from "@/lib/types";

/**
 * Hook to fetch the authenticated user's profile.
 * Query key: ["profile"]
 */
export function useProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch profile");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to update the authenticated user's profile.
 * On success, invalidates queryKey: ["profile"]
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UserProfileUpdate>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update profile");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
