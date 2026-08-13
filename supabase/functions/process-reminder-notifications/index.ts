import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/**
 * Supabase Edge Function: process-reminder-notifications
 *
 * Production entry point for automated AutoLog reminder notifications.
 * Designed for execution by Supabase Cron (pg_cron) or manual authorized HTTP requests.
 *
 * Security:
 *   - Verifies Authorization header against CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY.
 *   - Never exposes API keys or secrets in logs/responses.
 *
 * Environment Secrets Required in Supabase Dashboard / CLI:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - RESEND_API_KEY
 *   - CRON_SECRET (optional custom secret for Cron authorization)
 */

interface RequestBody {
  referenceDate?: string;
  userId?: string;
  overrideEmail?: string;
}

// Default sender for Resend
const DEFAULT_SENDER = "AutoLog <onboarding@resend.dev>";

// Helper: Calculate day difference for YYYY-MM-DD
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1.split("T")[0]);
  const d2 = new Date(dateStr2.split("T")[0]);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

// Helper: Format email HTML & text
function generateEmailContent(candidate: any, vehicleName: string) {
  const { title, notificationType, dueDate, dueOdometer, currentOdometer } = candidate;

  let badgeLabel = "";
  let badgeColor = "#0d9488";
  let headline = "";
  let message = "";

  switch (notificationType) {
    case "due_7_days":
      badgeLabel = "Upcoming (7 Days)";
      badgeColor = "#0284c7";
      headline = "Upcoming Maintenance Reminder";
      message = `Your ${vehicleName} has a scheduled maintenance reminder due in 7 days.`;
      break;
    case "due_1_day":
      badgeLabel = "Due Tomorrow";
      badgeColor = "#f59e0b";
      headline = "Maintenance Due Tomorrow";
      message = `Your ${vehicleName} has a maintenance task due tomorrow.`;
      break;
    case "due_today":
      badgeLabel = "Due Today";
      badgeColor = "#ef4444";
      headline = "Maintenance Due Today!";
      message = `Your ${vehicleName} has a maintenance task due today.`;
      break;
    case "mileage_1000":
      badgeLabel = "Mileage Notice (1,000 km)";
      badgeColor = "#0284c7";
      headline = "Approaching Maintenance Mileage";
      message = `Your ${vehicleName} is within 1,000 km of its scheduled maintenance threshold.`;
      break;
    case "mileage_500":
      badgeLabel = "Mileage Notice (500 km)";
      badgeColor = "#f59e0b";
      headline = "Approaching Maintenance Mileage";
      message = `Your ${vehicleName} is within 500 km of its scheduled maintenance threshold.`;
      break;
    case "mileage_due":
      badgeLabel = "Mileage Reached";
      badgeColor = "#ef4444";
      headline = "Maintenance Mileage Reached!";
      message = `Your ${vehicleName} has reached or exceeded its target maintenance mileage limit.`;
      break;
    default:
      badgeLabel = "Maintenance Notice";
      headline = "Vehicle Maintenance Notice";
      message = `Notice for your vehicle ${vehicleName}.`;
      break;
  }

  const subject = `AutoLog — ${headline}: ${title} (${vehicleName})`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: sans-serif;">
        <table width="100%" style="background-color: #f3f4f6; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background-color: #0f172a; padding: 16px 20px; border-radius: 8px;">
                    <span style="font-size: 20px; font-weight: 700; color: #14b8a6;">AutoLog</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <span style="background-color: ${badgeColor}20; color: ${badgeColor}; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600;">${badgeLabel}</span>
                    <h2 style="color: #0f172a; margin-top: 12px;">${headline}</h2>
                    <p style="color: #475569;">${message}</p>
                    <table width="100%" style="background-color: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px;">
                      <tr><td><strong>Vehicle:</strong></td><td>${vehicleName}</td></tr>
                      <tr><td><strong>Task:</strong></td><td>${title}</td></tr>
                      ${dueDate ? `<tr><td><strong>Due Date:</strong></td><td>${dueDate}</td></tr>` : ""}
                      ${dueOdometer !== null ? `<tr><td><strong>Due Mileage:</strong></td><td>${dueOdometer.toLocaleString()} km</td></tr>` : ""}
                      ${currentOdometer !== null ? `<tr><td><strong>Current Mileage:</strong></td><td>${currentOdometer.toLocaleString()} km</td></tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

Deno.serve(async (req) => {
  // 1. Security & Authentication check
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const expectedBearerTokens = [
    cronSecret ? `Bearer ${cronSecret}` : null,
    serviceRoleKey ? `Bearer ${serviceRoleKey}` : null,
  ].filter(Boolean);

  if (expectedBearerTokens.length > 0 && (!authHeader || !expectedBearerTokens.includes(authHeader))) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!url || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfiguration: Missing Supabase credentials." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfiguration: Missing RESEND_API_KEY." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse optional request payload
    let body: RequestBody = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        // empty body allowed
      }
    }

    const referenceDateStr = body.referenceDate || new Date().toISOString().split("T")[0];
    const supabase = createClient(url, serviceRoleKey);
    const resend = new Resend(resendApiKey);

    // 2. Fetch pending reminders
    let remindersQuery = supabase.from("maintenance_reminders").select("*").eq("status", "pending");
    if (body.userId) {
      remindersQuery = remindersQuery.eq("user_id", body.userId);
    }

    const { data: reminders, error: remindersError } = await remindersQuery;
    if (remindersError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to query reminders: ${remindersError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          referenceDate: referenceDateStr,
          totalCandidates: 0,
          processed: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
          outcomes: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const vehicleIds = Array.from(new Set(reminders.map((r: any) => r.vehicle_id)));
    const userIds = Array.from(new Set(reminders.map((r: any) => r.user_id)));
    const reminderIds = reminders.map((r: any) => r.id);

    // Fetch vehicles
    const { data: vehiclesData } = await supabase.from("vehicles").select("*").in("id", vehicleIds);
    const vehicleMap = new Map();
    (vehiclesData || []).forEach((v: any) => vehicleMap.set(v.id, v));

    // Fetch user settings
    const { data: settingsData } = await supabase.from("user_settings").select("*").in("user_id", userIds);
    const settingsMap = new Map();
    (settingsData || []).forEach((s: any) => settingsMap.set(s.user_id, s));

    // Fetch existing sent notifications for deduplication (only sent status!)
    const { data: sentHistory } = await supabase
      .from("reminder_notifications")
      .select("reminder_id, notification_type, scheduled_for")
      .in("reminder_id", reminderIds)
      .eq("scheduled_for", referenceDateStr)
      .eq("status", "sent");

    const sentHistorySet = new Set();
    (sentHistory || []).forEach((h: any) => {
      sentHistorySet.add(`${h.reminder_id}:${h.notification_type}:${h.scheduled_for}`);
    });

    // 3. Evaluate candidates
    const candidates: any[] = [];
    for (const reminder of reminders) {
      const vehicle = vehicleMap.get(reminder.vehicle_id);
      const userSettings = settingsMap.get(reminder.user_id);

      if (userSettings && userSettings.email_notifications === false) {
        continue;
      }

      // Date evaluation
      if (reminder.due_date) {
        const days = getDaysDifference(reminder.due_date, referenceDateStr);
        let type = null;
        if (days === 7) type = "due_7_days";
        else if (days === 1) type = "due_1_day";
        else if (days === 0) type = "due_today";

        if (type && !sentHistorySet.has(`${reminder.id}:${type}:${referenceDateStr}`)) {
          candidates.push({
            reminderId: reminder.id,
            userId: reminder.user_id,
            vehicleId: reminder.vehicle_id,
            title: reminder.title,
            notificationType: type,
            scheduledFor: referenceDateStr,
            dueDate: reminder.due_date,
            dueOdometer: reminder.due_odometer,
            currentOdometer: vehicle?.current_odometer ?? null,
          });
        }
      }

      // Mileage evaluation
      if (reminder.due_odometer !== null && reminder.due_odometer !== undefined && vehicle?.current_odometer) {
        const remaining = reminder.due_odometer - vehicle.current_odometer;
        let type = null;
        if (remaining <= 0) type = "mileage_due";
        else if (remaining <= 500) type = "mileage_500";
        else if (remaining <= 1000) type = "mileage_1000";

        if (type && !sentHistorySet.has(`${reminder.id}:${type}:${referenceDateStr}`)) {
          candidates.push({
            reminderId: reminder.id,
            userId: reminder.user_id,
            vehicleId: reminder.vehicle_id,
            title: reminder.title,
            notificationType: type,
            scheduledFor: referenceDateStr,
            dueDate: reminder.due_date,
            dueOdometer: reminder.due_odometer,
            currentOdometer: vehicle.current_odometer,
          });
        }
      }
    }

    // 4. Process candidates independently
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const outcomes: any[] = [];

    for (const candidate of candidates) {
      try {
        // Lookup user email
        let recipientEmail = body.overrideEmail;
        if (!recipientEmail) {
          const { data: userData } = await supabase.auth.admin.getUserById(candidate.userId);
          recipientEmail = userData?.user?.email;
        }

        if (!recipientEmail) {
          skippedCount++;
          outcomes.push({
            reminderId: candidate.reminderId,
            notificationType: candidate.notificationType,
            status: "skipped_no_email",
          });
          continue;
        }

        const vehicle = vehicleMap.get(candidate.vehicleId);
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle";
        const emailContent = generateEmailContent(candidate, vehicleName);

        const emailRes = await resend.emails.send({
          from: DEFAULT_SENDER,
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (emailRes.data && !emailRes.error) {
          sentCount++;
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
            notificationType: candidate.notificationType,
            status: "sent",
            recipientEmail,
            messageId: emailRes.data.id,
          });
        } else {
          failedCount++;
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

          console.error(`[EdgeFunction] Resend error for reminder ${candidate.reminderId}:`, emailRes.error?.message);
          outcomes.push({
            reminderId: candidate.reminderId,
            notificationType: candidate.notificationType,
            status: "failed",
            error: emailRes.error?.message || "Resend failed",
          });
        }
      } catch (err: any) {
        failedCount++;
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

        console.error(`[EdgeFunction] Exception processing reminder ${candidate.reminderId}:`, err.message);
        outcomes.push({
          reminderId: candidate.reminderId,
          notificationType: candidate.notificationType,
          status: "failed",
          error: err.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        referenceDate: referenceDateStr,
        totalCandidates: candidates.length,
        processed: candidates.length,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
        outcomes,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal Edge Function Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
