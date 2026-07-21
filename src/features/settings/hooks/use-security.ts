import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Security session details returned from /api/security/session
 */
export interface SecuritySession {
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  provider: string;
}

/**
 * Hook to fetch the current user's security/session info.
 * Query key: ["security-session"]
 */
export function useSecuritySession() {
  return useQuery<SecuritySession, Error>({
    queryKey: ["security-session"],
    queryFn: async () => {
      const res = await fetch("/api/security/session");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch session info");
      }
      return (await res.json()).data;
    },
  });
}

/**
 * Hook to change the user's password.
 * POST /api/security/change-password
 */
export function useChangePassword() {
  return useMutation<{ success: boolean }, Error, { new_password: string }>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to change password");
      }
      return (await res.json()).data;
    },
  });
}

/**
 * Hook to permanently delete the authenticated user's account.
 * POST /api/delete-account
 *
 * On success: clears the entire React Query cache so stale user data
 * cannot be accessed after deletion. The calling component is responsible
 * for signing out and redirecting.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/delete-account", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete account");
      }
      return (await res.json()).data;
    },
    onSuccess: () => {
      // Clear entire React Query cache — user data must not persist post-deletion.
      queryClient.clear();
    },
  });
}
