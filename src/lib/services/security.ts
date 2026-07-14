import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/lib/types";

/**
 * Security Service
 *
 * Handles password changes and session information retrieval via Supabase Auth.
 */

export interface SecuritySession {
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  provider: string;
}

export async function getSecuritySession(
  supabase: SupabaseClient
): Promise<ApiResponse<SecuritySession>> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return { data: null, error: error.message };
  if (!user) return { data: null, error: "Not authenticated." };

  const session: SecuritySession = {
    email: user.email || "",
    email_confirmed_at: user.email_confirmed_at || null,
    last_sign_in_at: user.last_sign_in_at || null,
    provider: user.app_metadata?.provider || "email",
  };

  return { data: session, error: null };
}

export async function changePassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<ApiResponse<{ success: boolean }>> {
  // TODO: Supabase does not verify the current password before updating.
  // Proper verification would require re-authentication (e.g. supabase.auth.signInWithPassword)
  // with the current password before calling updateUser, which requires the user's
  // credentials to be sent securely and re-verified server-side.
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { data: null, error: error.message };
  return { data: { success: true }, error: null };
}
