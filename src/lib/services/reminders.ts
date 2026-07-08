import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceReminder,
  MaintenanceReminderInsert,
  MaintenanceReminderUpdate,
  ApiResponse,
} from "@/lib/types";

/**
 * Maintenance Reminders Service
 *
 * All Supabase queries for the maintenance_reminders domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership — no user_id filtering needed on reads.
 */

export async function getReminders(
  supabase: SupabaseClient,
  vehicleId?: string
): Promise<ApiResponse<MaintenanceReminder[]>> {
  let query = supabase
    .from("maintenance_reminders")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: data as MaintenanceReminder[], error: null };
}

export async function getReminder(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<MaintenanceReminder>> {
  const { data, error } = await supabase
    .from("maintenance_reminders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MaintenanceReminder, error: null };
}

export async function createReminder(
  supabase: SupabaseClient,
  userId: string,
  payload: MaintenanceReminderInsert
): Promise<ApiResponse<MaintenanceReminder>> {
  const { data, error } = await supabase
    .from("maintenance_reminders")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MaintenanceReminder, error: null };
}

export async function updateReminder(
  supabase: SupabaseClient,
  id: string,
  payload: MaintenanceReminderUpdate
): Promise<ApiResponse<MaintenanceReminder>> {
  const { data, error } = await supabase
    .from("maintenance_reminders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MaintenanceReminder, error: null };
}

export async function deleteReminder(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { error } = await supabase
    .from("maintenance_reminders")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
