import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile, UserProfileUpdate, ApiResponse } from "@/lib/types";

/**
 * Profile Service
 *
 * Interacts with Supabase Auth to retrieve and update user metadata profiles.
 */

export async function getUserProfile(
  supabase: SupabaseClient
): Promise<ApiResponse<UserProfile>> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!user) {
    return { data: null, error: "No authenticated user session found." };
  }

  const profile: UserProfile = {
    email: user.email || "",
    created_at: user.created_at || "",
    full_name: user.user_metadata?.full_name || "",
    country: user.user_metadata?.country || null,
    timezone: user.user_metadata?.timezone || null,
  };

  return { data: profile, error: null };
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  payload: UserProfileUpdate
): Promise<ApiResponse<UserProfile>> {
  const { data: { user }, error } = await supabase.auth.updateUser({
    data: {
      full_name: payload.full_name,
      country: payload.country || null,
      timezone: payload.timezone || null,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!user) {
    return { data: null, error: "Failed to retrieve user after update." };
  }

  const profile: UserProfile = {
    email: user.email || "",
    created_at: user.created_at || "",
    full_name: user.user_metadata?.full_name || "",
    country: user.user_metadata?.country || null,
    timezone: user.user_metadata?.timezone || null,
  };

  return { data: profile, error: null };
}
