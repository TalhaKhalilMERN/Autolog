import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/services/activities";

/**
 * Security Service
 *
 * Handles password changes and session information retrieval via Supabase Auth.
 * Automatically logs security activity on password changes.
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
  const { data: { user }, error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { data: null, error: error.message };

  if (user) {
    await logActivity(supabase, {
      userId: user.id,
      entityType: "security",
      entityId: user.id,
      action: "updated",
      title: "Password Changed",
      description: "Account password was successfully updated.",
      metadata: { event: "password_change" },
      iconType: "security",
    });
  }

  return { data: { success: true }, error: null };
}
