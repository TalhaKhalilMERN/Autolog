import type { NotificationCandidate } from "@/lib/types";

export interface FormattedEmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Formats a date string (YYYY-MM-DD) into a friendly display format.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates email subject, HTML, and plaintext body for a reminder notification candidate.
 */
export function generateReminderEmailContent(
  candidate: NotificationCandidate,
  vehicleName: string
): FormattedEmailContent {
  const { title, notificationType, dueDate, dueOdometer, currentOdometer } = candidate;

  const isMileage = notificationType.startsWith("mileage_");

  let badgeLabel = "";
  let badgeColor = "#0d9488"; // primary teal
  let headline = "";
  let message = "";

  switch (notificationType) {
    case "due_7_days":
      badgeLabel = "Upcoming (7 Days)";
      badgeColor = "#0284c7"; // sky blue
      headline = "Upcoming Maintenance Reminder";
      message = `Your ${vehicleName} has a scheduled maintenance reminder due in 7 days (${formatDate(dueDate)}).`;
      break;

    case "due_1_day":
      badgeLabel = "Due Tomorrow";
      badgeColor = "#f59e0b"; // amber
      headline = "Maintenance Due Tomorrow";
      message = `Your ${vehicleName} has a maintenance task due tomorrow (${formatDate(dueDate)}).`;
      break;

    case "due_today":
      badgeLabel = "Due Today";
      badgeColor = "#ef4444"; // red
      headline = "Maintenance Due Today!";
      message = `Your ${vehicleName} has a maintenance task due today (${formatDate(dueDate)}).`;
      break;

    case "mileage_1000":
      badgeLabel = "Mileage Notice (1,000 km)";
      badgeColor = "#0284c7";
      headline = "Approaching Maintenance Mileage";
      message = `Your ${vehicleName} is within 1,000 km of its scheduled maintenance odometer threshold.`;
      break;

    case "mileage_500":
      badgeLabel = "Mileage Notice (500 km)";
      badgeColor = "#f59e0b";
      headline = "Approaching Maintenance Mileage";
      message = `Your ${vehicleName} is within 500 km of its scheduled maintenance odometer threshold.`;
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
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 24px 30px; text-align: left;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="font-size: 20px; font-weight: 700; color: #14b8a6; letter-spacing: -0.5px;">AutoLog</span>
                          <span style="font-size: 12px; color: #94a3b8; margin-left: 8px;">Fleet Management</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                      ${badgeLabel}
                    </div>

                    <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${headline}
                    </h1>

                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                      ${message}
                    </p>

                    <!-- Details Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 35%;">Vehicle</td>
                              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${vehicleName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Task Title</td>
                              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${title}</td>
                            </tr>
                            ${
                              dueDate
                                ? `
                            <tr>
                              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Due Date</td>
                              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${formatDate(dueDate)}</td>
                            </tr>`
                                : ""
                            }
                            ${
                              dueOdometer !== null && dueOdometer !== undefined
                                ? `
                            <tr>
                              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Due Mileage</td>
                              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${dueOdometer.toLocaleString()} km</td>
                            </tr>`
                                : ""
                            }
                            ${
                              currentOdometer !== null && currentOdometer !== undefined
                                ? `
                            <tr>
                              <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Current Mileage</td>
                              <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${currentOdometer.toLocaleString()} km</td>
                            </tr>`
                                : ""
                            }
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                      You are receiving this automated email based on your AutoLog notification settings.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      &copy; ${new Date().getFullYear()} AutoLog. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
AutoLog — ${headline}

Vehicle: ${vehicleName}
Task: ${title}
${dueDate ? `Due Date: ${formatDate(dueDate)}\n` : ""}${
    dueOdometer !== null ? `Due Mileage: ${dueOdometer.toLocaleString()} km\n` : ""
  }${currentOdometer !== null ? `Current Mileage: ${currentOdometer.toLocaleString()} km\n` : ""}

${message}

---
You received this automated notification from AutoLog.
  `.trim();

  return { subject, html, text };
}
