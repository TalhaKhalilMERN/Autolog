import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceReminder,
  MaintenanceReminderInsert,
  MaintenanceReminderUpdate,
  ApiResponse,
} from "@/lib/types";
import { logActivity } from "@/lib/services/activities";

/**
 * Maintenance Reminders Service
 *
 * All Supabase queries for the maintenance_reminders domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
 * Automatically logs activities on CRUD events.
 */

export async function getReminders(
  supabase: SupabaseClient,
  vehicleId?: string
): Promise<ApiResponse<MaintenanceReminder[]>> {
  let query = supabase
    .from("maintenance_reminders")
    .select("*")
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
  // Fetch vehicle details for activity logging & odometer validation
  const { data: vehicleRow } = await supabase
    .from("vehicles")
    .select("make, model, current_odometer")
    .eq("id", payload.vehicle_id)
    .maybeSingle();

  if (
    payload.due_odometer !== null &&
    payload.due_odometer !== undefined &&
    vehicleRow &&
    vehicleRow.current_odometer !== null &&
    vehicleRow.current_odometer !== undefined
  ) {
    if (payload.due_odometer <= vehicleRow.current_odometer) {
      return {
        data: null,
        error: `Due odometer (${payload.due_odometer.toLocaleString()} km) must be greater than current vehicle odometer (${vehicleRow.current_odometer.toLocaleString()} km).`,
      };
    }
  }

  const vehicleName = vehicleRow ? `${vehicleRow.make} ${vehicleRow.model}` : "vehicle";

  const { data, error } = await supabase
    .from("maintenance_reminders")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const reminder = data as MaintenanceReminder;

  await logActivity(supabase, {
    userId,
    entityType: "reminder",
    entityId: reminder.id,
    action: "created",
    title: "Reminder Created",
    description: `${reminder.title} reminder scheduled for ${vehicleName}.`,
    metadata: {
      title: reminder.title,
      due_date: reminder.due_date,
      due_odometer: reminder.due_odometer,
      reminder_type: reminder.reminder_type,
      vehicle_name: vehicleName,
    },
    iconType: "reminder",
  });

  return { data: reminder, error: null };
}

export async function updateReminder(
  supabase: SupabaseClient,
  id: string,
  payload: MaintenanceReminderUpdate
): Promise<ApiResponse<MaintenanceReminder>> {
  if (payload.vehicle_id && payload.due_odometer !== null && payload.due_odometer !== undefined) {
    const { data: vehicleRow } = await supabase
      .from("vehicles")
      .select("current_odometer")
      .eq("id", payload.vehicle_id)
      .maybeSingle();

    if (
      vehicleRow &&
      vehicleRow.current_odometer !== null &&
      vehicleRow.current_odometer !== undefined &&
      payload.due_odometer <= vehicleRow.current_odometer
    ) {
      return {
        data: null,
        error: `Due odometer (${payload.due_odometer.toLocaleString()} km) must be greater than current vehicle odometer (${vehicleRow.current_odometer.toLocaleString()} km).`,
      };
    }
  }

  const { data, error } = await supabase
    .from("maintenance_reminders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const reminder = data as MaintenanceReminder;

  await logActivity(supabase, {
    userId: reminder.user_id,
    entityType: "reminder",
    entityId: reminder.id,
    action: "updated",
    title: "Reminder Updated",
    description: `Updated reminder "${reminder.title}".`,
    metadata: {
      title: reminder.title,
      status: reminder.status,
      due_date: reminder.due_date,
    },
    iconType: "reminder",
  });

  return { data: reminder, error: null };
}

export async function deleteReminder(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { data: reminder } = await supabase
    .from("maintenance_reminders")
    .select("user_id, title")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("maintenance_reminders")
    .delete()
    .eq("id", id);

  if (error) return { data: null, error: error.message };

  if (reminder) {
    await logActivity(supabase, {
      userId: reminder.user_id,
      entityType: "reminder",
      entityId: id,
      action: "deleted",
      title: "Reminder Deleted",
      description: `Removed reminder "${reminder.title}".`,
      metadata: { title: reminder.title },
      iconType: "reminder",
    });
  }

  return { data: { id }, error: null };
}
