import { useQuery, useMutation } from "@tanstack/react-query";

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
