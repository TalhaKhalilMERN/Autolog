import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateReminderNotifications } from "@/lib/services/reminder-evaluation";
import { sendEmail } from "@/lib/email/resend";
import { generateReminderEmailContent } from "@/lib/email/templates";
import type { NotificationCandidate, ApiResponse } from "@/lib/types";

export interface ProcessRemindersOptions {
  /** Optional date to evaluate candidates for (YYYY-MM-DD), defaults to today */
  referenceDate?: string;
  /** Optional user ID filter */
  userId?: string;
  /** Optional forced recipient email (useful for local development testing with Resend free tier) */
  overrideRecipientEmail?: string;
}

export interface CandidateProcessOutcome {
  reminderId: string;
  userId: string;
  notificationType: string;
  scheduledFor: string;
  status: "sent" | "failed" | "skipped_duplicate" | "skipped_no_email";
  recipientEmail?: string;
  messageId?: string;
  error?: string;
}

export interface NotificationProcessorSummary {
  referenceDate: string;
  totalCandidates: number;
  processedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  outcomes: CandidateProcessOutcome[];
}

/**
 * Server-side Notification Processor for AutoLog.
 *
 * Connects:
 *   evaluateReminderNotifications() -> candidates -> Resend email service -> reminder_notifications
 *
 * Safe to execute multiple times (idempotent duplicate protection).
 * Error isolated: failure for one candidate will not interrupt processing of remaining candidates.
 */
export async function processReminderNotifications(
  supabase: SupabaseClient,
  options?: ProcessRemindersOptions
): Promise<ApiResponse<NotificationProcessorSummary>> {
  try {
    const referenceDateStr = options?.referenceDate || new Date().toISOString().split("T")[0];

    // 1. Evaluate database state to find notification candidates
    const evalResult = await evaluateReminderNotifications(supabase, {
      referenceDate: referenceDateStr,
      userId: options?.userId,
    });

    if (evalResult.error) {
      return { data: null, error: `Evaluation error: ${evalResult.error}` };
    }

    const candidates = evalResult.data || [];
    if (candidates.length === 0) {
      return {
        data: {
          referenceDate: referenceDateStr,
          totalCandidates: 0,
          processedCount: 0,
          sentCount: 0,
          failedCount: 0,
          skippedCount: 0,
          outcomes: [],
        },
        error: null,
      };
    }

    // Extract unique vehicle and user IDs for name & email lookups
    const vehicleIds = Array.from(new Set(candidates.map((c) => c.vehicleId)));
    const userIds = Array.from(new Set(candidates.map((c) => c.userId)));

    // 2. Fetch vehicle make / model for display names
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, make, model, year")
      .in("id", vehicleIds);

    const vehicleNameMap = new Map<string, string>();
    (vehicles || []).forEach((v) => {
      vehicleNameMap.set(v.id, `${v.year} ${v.make} ${v.model}`);
    });

    // 3. Fetch user email addresses using Supabase auth admin or user lookup map
    const userEmailMap = new Map<string, string>();
    for (const uId of userIds) {
      if (options?.overrideRecipientEmail) {
        userEmailMap.set(uId, options.overrideRecipientEmail);
      } else {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(uId);
          if (userData?.user?.email) {
            userEmailMap.set(uId, userData.user.email);
          }
        } catch {
          // If admin auth.getUserById fails, try reading profile/settings
        }
      }
    }

    // 4. Fetch existing sent notification history for deduplication double-check
    const reminderIds = candidates.map((c) => c.reminderId);
    const { data: existingSentHistory } = await supabase
      .from("reminder_notifications")
      .select("reminder_id, notification_type, scheduled_for, status")
      .in("reminder_id", reminderIds)
      .eq("scheduled_for", referenceDateStr)
      .eq("status", "sent");

    const sentHistorySet = new Set<string>();
    (existingSentHistory || []).forEach((h) => {
      sentHistorySet.add(`${h.reminder_id}:${h.notification_type}:${h.scheduled_for}`);
    });

    // 5. Process each candidate independently with error isolation
    const outcomes: CandidateProcessOutcome[] = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const candidate of candidates) {
      const historyKey = `${candidate.reminderId}:${candidate.notificationType}:${candidate.scheduledFor}`;

      // Deduplication Check: Skip if already successfully sent
      if (sentHistorySet.has(historyKey)) {
        skippedCount++;
        outcomes.push({
          reminderId: candidate.reminderId,
          userId: candidate.userId,
          notificationType: candidate.notificationType,
          scheduledFor: candidate.scheduledFor,
          status: "skipped_duplicate",
        });
        continue;
      }

      // Check recipient email availability
      const recipientEmail = options?.overrideRecipientEmail || userEmailMap.get(candidate.userId);
      if (!recipientEmail || !recipientEmail.trim()) {
        skippedCount++;
        outcomes.push({
          reminderId: candidate.reminderId,
          userId: candidate.userId,
          notificationType: candidate.notificationType,
          scheduledFor: candidate.scheduledFor,
          status: "skipped_no_email",
          error: `No valid email address found for user ID: ${candidate.userId}`,
        });
        continue;
      }

      // Process sending email in isolated block
      try {
        const vehicleName = vehicleNameMap.get(candidate.vehicleId) || "Vehicle";
        const emailContent = generateReminderEmailContent(candidate, vehicleName);

        const emailResult = await sendEmail({
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailResult.success) {
          sentCount++;
          // Record successful notification send in database
          await supabase.from("reminder_notifications").upsert(
            {
              reminder_id: candidate.reminderId,
              user_id: candidate.userId,
              notification_type: candidate.notificationType,
              scheduled_for: candidate.scheduledFor,
              status: "sent",
              sent_at: new Date().toISOString(),
            },
            { onConflict: "reminder_id, notification_type, scheduled_for" }
          );

          outcomes.push({
            reminderId: candidate.reminderId,
            userId: candidate.userId,
            notificationType: candidate.notificationType,
            scheduledFor: candidate.scheduledFor,
            status: "sent",
            recipientEmail,
            messageId: emailResult.data?.id,
          });
        } else {
          failedCount++;
          // Record failed notification attempt in database
          await supabase.from("reminder_notifications").upsert(
            {
              reminder_id: candidate.reminderId,
              user_id: candidate.userId,
              notification_type: candidate.notificationType,
              scheduled_for: candidate.scheduledFor,
              status: "failed",
              sent_at: null,
            },
            { onConflict: "reminder_id, notification_type, scheduled_for" }
          );

          // Log server error securely without exposing API keys or secrets
          console.error(
            `[NotificationProcessor] Email delivery failed for reminder ${candidate.reminderId} (user: ${candidate.userId}):`,
            emailResult.error
          );

          outcomes.push({
            reminderId: candidate.reminderId,
            userId: candidate.userId,
            notificationType: candidate.notificationType,
            scheduledFor: candidate.scheduledFor,
            status: "failed",
            recipientEmail,
            error: emailResult.error || "Failed to deliver email via Resend",
          });
        }
      } catch (err: any) {
        failedCount++;
        // Record unexpected error failure in database
        await supabase.from("reminder_notifications").upsert(
          {
            reminder_id: candidate.reminderId,
            user_id: candidate.userId,
            notification_type: candidate.notificationType,
            scheduled_for: candidate.scheduledFor,
            status: "failed",
            sent_at: null,
          },
          { onConflict: "reminder_id, notification_type, scheduled_for" }
        );

        console.error(
          `[NotificationProcessor] Unexpected error processing reminder ${candidate.reminderId}:`,
          err.message || err
        );

        outcomes.push({
          reminderId: candidate.reminderId,
          userId: candidate.userId,
          notificationType: candidate.notificationType,
          scheduledFor: candidate.scheduledFor,
          status: "failed",
          error: err.message || "Unexpected internal error",
        });
      }
    }

    return {
      data: {
        referenceDate: referenceDateStr,
        totalCandidates: candidates.length,
        processedCount: candidates.length,
        sentCount,
        failedCount,
        skippedCount,
        outcomes,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || "An unexpected error occurred during notification processing.",
    };
  }
}
