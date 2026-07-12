import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSettings, UserSettingsUpdate, ApiResponse } from "@/lib/types";

/**
 * User Settings Service
 *
 * Handles fetching and updating user-specific settings.
 * If settings do not exist for the user, defaults will be automatically created.
 */

const DEFAULT_SETTINGS = {
  email_notifications: false,
  notification_days_before: 3,
  notify_by_odometer: false,
  odometer_threshold: 500,
  notification_frequency: "once" as const,
};

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<ApiResponse<UserSettings>> {
  // Try to select settings for this user
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  // If settings don't exist yet, create default settings
  if (!data) {
    const { data: newSettings, error: insertError } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        ...DEFAULT_SETTINGS,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: newSettings as UserSettings, error: null };
  }

  return { data: data as UserSettings, error: null };
}

export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  payload: UserSettingsUpdate
): Promise<ApiResponse<UserSettings>> {
  const { data, error } = await supabase
    .from("user_settings")
    .update(payload)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // If somehow no settings row exists yet to update, we can upsert instead
    if (error.code === "PGRST116" || error.message.includes("contains 0 rows")) {
      const { data: upsertData, error: upsertError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: userId,
          ...DEFAULT_SETTINGS,
          ...payload,
        })
        .select()
        .single();

      if (upsertError) {
        return { data: null, error: upsertError.message };
      }
      return { data: upsertData as UserSettings, error: null };
    }
    return { data: null, error: error.message };
  }

  return { data: data as UserSettings, error: null };
}
