import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceReminder,
  Vehicle,
  UserSettings,
  NotificationType,
  NotificationCandidate,
  ApiResponse,
} from "@/lib/types";

/**
 * Calculates calendar day difference (date1 - date2) for YYYY-MM-DD strings.
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1.split("T")[0]);
  const d2 = new Date(dateStr2.split("T")[0]);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export interface SingleReminderEvaluationParams {
  reminder: MaintenanceReminder;
  vehicle?: Vehicle | null;
  userSettings?: UserSettings | null;
  existingNotificationTypesForScheduledDate?: Set<string>;
  referenceDateStr?: string; // YYYY-MM-DD
}

/**
 * Pure function to evaluate a single reminder against current state and reference date.
 * Returns array of eligible notification candidates (usually 0 or 1).
 */
export function evaluateSingleReminder(
  params: SingleReminderEvaluationParams
): NotificationCandidate[] {
  const {
    reminder,
    vehicle,
    userSettings,
    existingNotificationTypesForScheduledDate = new Set(),
    referenceDateStr = new Date().toISOString().split("T")[0],
  } = params;

  // 1. Only active (pending) reminders qualify
  if (reminder.status !== "pending") {
    return [];
  }

  // 2. Check user notification settings
  // If user settings record exists and email_notifications is explicitly false, suppress candidate.
  if (userSettings && userSettings.email_notifications === false) {
    return [];
  }

  const candidates: NotificationCandidate[] = [];

  // 3. Date-based Reminder Evaluation
  if (reminder.due_date) {
    const daysRemaining = getDaysDifference(reminder.due_date, referenceDateStr);

    let dateNotificationType: NotificationType | null = null;
    if (daysRemaining === 7) {
      dateNotificationType = "due_7_days";
    } else if (daysRemaining === 1) {
      dateNotificationType = "due_1_day";
    } else if (daysRemaining === 0) {
      dateNotificationType = "due_today";
    }

    if (dateNotificationType) {
      const isAlreadyNotified = existingNotificationTypesForScheduledDate.has(dateNotificationType);
      if (!isAlreadyNotified) {
        candidates.push({
          reminderId: reminder.id,
          userId: reminder.user_id,
          notificationType: dateNotificationType,
          scheduledFor: referenceDateStr,
          vehicleId: reminder.vehicle_id,
          title: reminder.title,
          dueDate: reminder.due_date,
          dueOdometer: reminder.due_odometer,
          currentOdometer: vehicle?.current_odometer ?? null,
        });
      }
    }
  }

  // 4. Mileage-based Reminder Evaluation
  if (reminder.due_odometer !== null && reminder.due_odometer !== undefined) {
    // Requires a valid vehicle current_odometer
    if (
      vehicle &&
      vehicle.current_odometer !== null &&
      vehicle.current_odometer !== undefined
    ) {
      const remainingKm = reminder.due_odometer - vehicle.current_odometer;

      let mileageNotificationType: NotificationType | null = null;
      if (remainingKm <= 0) {
        mileageNotificationType = "mileage_due";
      } else if (remainingKm <= 500) {
        mileageNotificationType = "mileage_500";
      } else if (remainingKm <= 1000) {
        mileageNotificationType = "mileage_1000";
      }

      if (mileageNotificationType) {
        const isAlreadyNotified = existingNotificationTypesForScheduledDate.has(mileageNotificationType);
        if (!isAlreadyNotified) {
          candidates.push({
            reminderId: reminder.id,
            userId: reminder.user_id,
            notificationType: mileageNotificationType,
            scheduledFor: referenceDateStr,
            vehicleId: reminder.vehicle_id,
            title: reminder.title,
            dueDate: reminder.due_date,
            dueOdometer: reminder.due_odometer,
            currentOdometer: vehicle.current_odometer,
          });
        }
      }
    }
  }

  return candidates;
}

export interface EvaluateRemindersOptions {
  referenceDate?: string; // YYYY-MM-DD
  userId?: string;
}

/**
 * Server-side evaluation service for AutoLog reminder notifications.
 * Queries current database state and evaluates eligible candidates.
 */
export async function evaluateReminderNotifications(
  supabase: SupabaseClient,
  options?: EvaluateRemindersOptions
): Promise<ApiResponse<NotificationCandidate[]>> {
  try {
    const referenceDateStr = options?.referenceDate || new Date().toISOString().split("T")[0];

    // 1. Fetch pending maintenance reminders
    let remindersQuery = supabase
      .from("maintenance_reminders")
      .select("*")
      .eq("status", "pending");

    if (options?.userId) {
      remindersQuery = remindersQuery.eq("user_id", options.userId);
    }

    const { data: reminders, error: remindersError } = await remindersQuery;
    if (remindersError) {
      return { data: null, error: `Failed to fetch reminders: ${remindersError.message}` };
    }

    if (!reminders || reminders.length === 0) {
      return { data: [], error: null };
    }

    // Extract unique vehicle and user IDs
    const vehicleIds = Array.from(new Set(reminders.map((r) => r.vehicle_id)));
    const userIds = Array.from(new Set(reminders.map((r) => r.user_id)));
    const reminderIds = reminders.map((r) => r.id);

    // 2. Fetch related vehicles
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("*")
      .in("id", vehicleIds);

    const vehicleMap = new Map<string, Vehicle>();
    (vehiclesData || []).forEach((v) => vehicleMap.set(v.id, v as Vehicle));

    // 3. Fetch related user_settings
    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("*")
      .in("user_id", userIds);

    const settingsMap = new Map<string, UserSettings>();
    (settingsData || []).forEach((s) => settingsMap.set(s.user_id, s as UserSettings));

    // 4. Fetch notification history for deduplication
    // Check reminder_notifications table
    const { data: historyData } = await supabase
      .from("reminder_notifications")
      .select("reminder_id, notification_type, scheduled_for")
      .in("reminder_id", reminderIds)
      .eq("scheduled_for", referenceDateStr);

    // Map of reminder_id -> Set of notification_types recorded for referenceDateStr
    const historyMap = new Map<string, Set<string>>();
    (historyData || []).forEach((h) => {
      if (!historyMap.has(h.reminder_id)) {
        historyMap.set(h.reminder_id, new Set());
      }
      historyMap.get(h.reminder_id)!.add(h.notification_type);
    });

    // 5. Evaluate all reminders against database state
    const allCandidates: NotificationCandidate[] = [];

    for (const reminder of reminders) {
      const vehicle = vehicleMap.get(reminder.vehicle_id) || null;
      const userSettings = settingsMap.get(reminder.user_id) || null;
      const existingTypes = historyMap.get(reminder.id) || new Set();

      const candidates = evaluateSingleReminder({
        reminder,
        vehicle,
        userSettings,
        existingNotificationTypesForScheduledDate: existingTypes,
        referenceDateStr,
      });

      allCandidates.push(...candidates);
    }

    return { data: allCandidates, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "An unexpected error occurred during reminder evaluation." };
  }
}
