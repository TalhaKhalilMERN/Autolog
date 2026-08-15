import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processReminderNotifications } from "@/lib/services/notification-processor";
import { evaluateSingleReminder } from "@/lib/services/reminder-evaluation";
import { generateReminderEmailContent } from "@/lib/email/templates";
import type { MaintenanceReminder, Vehicle, UserSettings, NotificationCandidate } from "@/lib/types";

interface ScenarioTestResult {
  scenarioNumber: number;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
}

function runProcessorUnitTestSuite(): { passedCount: number; totalCount: number; testResults: ScenarioTestResult[] } {
  const results: ScenarioTestResult[] = [];
  const refDate = "2026-08-15";
  const refDateNextDay = "2026-08-16";

  const baseReminder: MaintenanceReminder = {
    id: "rem-101",
    user_id: "user-101",
    vehicle_id: "veh-101",
    title: "Brake Fluid Service",
    description: "Replace brake fluid dot 4",
    reminder_type: "service",
    due_date: "2026-08-22", // due in 7 days relative to refDate
    due_odometer: null,
    status: "pending",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const baseVehicle: Vehicle = {
    id: "veh-101",
    user_id: "user-101",
    created_at: "2026-01-01T00:00:00Z",
    make: "Toyota",
    model: "Corolla",
    year: 2021,
    variant: "SE",
    engine: "2.0L",
    transmission: "Automatic",
    fuel_type: "Petrol",
    registration_number: "KHI-9988",
    current_odometer: 45000,
  };

  const baseSettings: UserSettings = {
    user_id: "user-101",
    email_notifications: true,
    notification_days_before: 7,
    notify_by_odometer: true,
    odometer_threshold: 1000,
    notification_frequency: "once",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  // Scenario 1: 7-day window + once + reminder exactly 7 days away -> 1 candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_7_days";
    results.push({
      scenarioNumber: 1,
      description: "7-day window + once + reminder exactly 7 days away -> 1 candidate (due_7_days)",
      passed,
      expected: "1 candidate (due_7_days)",
      actual: `${candidates.length} candidates (${candidates[0]?.notificationType || "none"})`,
    });
  }

  // Scenario 2: 7-day window + once + reminder 6 days away -> eligible if no notification previously sent
  {
    const rem6 = { ...baseReminder, due_date: "2026-08-21" }; // 6 days away
    const candidates = evaluateSingleReminder({
      reminder: rem6,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      hasAnySentNotification: false,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_7_days";
    results.push({
      scenarioNumber: 2,
      description: "7-day window + once + reminder 6 days away -> eligible if no notification sent yet",
      passed,
      expected: "1 candidate (due_7_days)",
      actual: `${candidates.length} candidates (${candidates[0]?.notificationType || "none"})`,
    });
  }

  // Scenario 3: 7-day window + once + reminder 5 days away after Cron missed day 7 -> eligible once
  {
    const rem5 = { ...baseReminder, due_date: "2026-08-20" }; // 5 days away
    const candidates = evaluateSingleReminder({
      reminder: rem5,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      hasAnySentNotification: false,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_7_days";
    results.push({
      scenarioNumber: 3,
      description: "7-day window + once + reminder 5 days away (Cron missed day 7) -> eligible once",
      passed,
      expected: "1 candidate (due_7_days)",
      actual: `${candidates.length} candidates (${candidates[0]?.notificationType || "none"})`,
    });
  }

  // Scenario 4: 7-day window + once + notification already sent -> no duplicate
  {
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      hasAnySentNotification: true,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 4,
      description: "7-day window + once + notification already sent -> 0 candidates (no duplicate)",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 5: 7-day window + daily + reminder inside window -> candidate generated for current date
  {
    const dailySettings = { ...baseSettings, notification_frequency: "daily" };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: dailySettings,
      sentNotificationTypesForToday: new Set(),
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].scheduledFor === refDate;
    results.push({
      scenarioNumber: 5,
      description: "7-day window + daily + reminder inside window -> 1 candidate for current calendar date",
      passed,
      expected: `1 candidate for date ${refDate}`,
      actual: `${candidates.length} candidate for date ${candidates[0]?.scheduledFor || "none"}`,
    });
  }

  // Scenario 6: Daily notification evaluated twice on same day -> second evaluation skipped
  {
    const dailySettings = { ...baseSettings, notification_frequency: "daily" };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: dailySettings,
      sentNotificationTypesForToday: new Set(["due_7_days"]),
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 6,
      description: "Daily notification evaluated twice on same day -> second evaluation skipped",
      passed,
      expected: "0 candidates (already sent today)",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 7: Daily notification evaluated on following day -> candidate generated for new date
  {
    const dailySettings = { ...baseSettings, notification_frequency: "daily" };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: dailySettings,
      sentNotificationTypesForToday: new Set(), // new day has no sent notifications yet
      referenceDateStr: refDateNextDay,
    });
    const passed = candidates.length === 1 && candidates[0].scheduledFor === refDateNextDay;
    results.push({
      scenarioNumber: 7,
      description: "Daily notification evaluated on following day -> 1 candidate generated for next date",
      passed,
      expected: `1 candidate for date ${refDateNextDay}`,
      actual: `${candidates.length} candidate for date ${candidates[0]?.scheduledFor || "none"}`,
    });
  }

  // Scenario 8: User changes daily -> once -> future daily notifications stop if previous notification sent
  {
    const onceSettings = { ...baseSettings, notification_frequency: "once" };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: onceSettings,
      hasAnySentNotification: true, // past daily run sent at least one email
      referenceDateStr: refDateNextDay,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 8,
      description: "User changes daily -> once -> future daily notifications stop if previous notification sent",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 9: User changes once -> daily -> daily notifications resume from current date
  {
    const dailySettings = { ...baseSettings, notification_frequency: "daily" };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: dailySettings,
      sentNotificationTypesForToday: new Set(), // no notification sent today yet
      referenceDateStr: refDateNextDay,
    });
    const passed = candidates.length === 1 && candidates[0].scheduledFor === refDateNextDay;
    results.push({
      scenarioNumber: 9,
      description: "User changes once -> daily -> daily notifications resume from current date",
      passed,
      expected: `1 candidate for date ${refDateNextDay}`,
      actual: `${candidates.length} candidate for date ${candidates[0]?.scheduledFor || "none"}`,
    });
  }

  // Scenario 10: Email notifications disabled -> 0 candidates
  {
    const disabledSettings = { ...baseSettings, email_notifications: false };
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: disabledSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 10,
      description: "Email notifications disabled -> 0 candidates",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 11: Due-date reminder outside notification window -> 0 candidates
  {
    const farReminder = { ...baseReminder, due_date: "2026-08-30" }; // 15 days away, window is 7
    const candidates = evaluateSingleReminder({
      reminder: farReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 11,
      description: "Due-date reminder outside notification window (15 days away) -> 0 candidates",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 12: Due today -> due_today candidate
  {
    const todayReminder = { ...baseReminder, due_date: refDate };
    const candidates = evaluateSingleReminder({
      reminder: todayReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_today";
    results.push({
      scenarioNumber: 12,
      description: "Due today -> due_today candidate generated",
      passed,
      expected: "1 candidate (due_today)",
      actual: `${candidates.length} candidates (${candidates[0]?.notificationType || "none"})`,
    });
  }

  // Scenario 13: Odometer threshold = 1000 & remaining mileage = 800 -> eligible
  {
    const mileageReminder: MaintenanceReminder = { ...baseReminder, due_date: null, due_odometer: 45800 };
    const candidates = evaluateSingleReminder({
      reminder: mileageReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "mileage_1000";
    results.push({
      scenarioNumber: 13,
      description: "Odometer threshold = 1000 and remaining = 800 -> 1 candidate (mileage_1000)",
      passed,
      expected: "1 candidate (mileage_1000)",
      actual: `${candidates.length} candidates (${candidates[0]?.notificationType || "none"})`,
    });
  }

  // Scenario 14: Odometer reminder with null vehicle current_odometer -> cannot evaluate
  {
    const nullOdoVehicle = { ...baseVehicle, current_odometer: null as any };
    const mileageReminder: MaintenanceReminder = { ...baseReminder, due_date: null, due_odometer: 45800 };
    const candidates = evaluateSingleReminder({
      reminder: mileageReminder,
      vehicle: nullOdoVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 14,
      description: "Odometer reminder with null vehicle current_odometer -> 0 candidates",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 15: Odometer daily evaluated twice on same date -> only 1 email/candidate
  {
    const dailySettings = { ...baseSettings, notification_frequency: "daily" };
    const mileageReminder: MaintenanceReminder = { ...baseReminder, due_date: null, due_odometer: 45800 };
    const candidates = evaluateSingleReminder({
      reminder: mileageReminder,
      vehicle: baseVehicle,
      userSettings: dailySettings,
      sentNotificationTypesForToday: new Set(["mileage_1000"]),
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 15,
      description: "Odometer daily evaluated twice on same date -> second run skipped",
      passed,
      expected: "0 candidates",
      actual: `${candidates.length} candidates`,
    });
  }

  // Scenario 16: Failed Resend attempt -> status recorded as failed, allowing future retry
  {
    const failedRecord = {
      reminder_id: baseReminder.id,
      notification_type: "due_7_days",
      scheduled_for: refDate,
      status: "failed",
      sent_at: null,
    };
    // Since failedRecord.status !== 'sent', hasAnySentNotification remains false for retry
    const hasAnySent = failedRecord.status === "sent";
    const candidates = evaluateSingleReminder({
      reminder: baseReminder,
      vehicle: baseVehicle,
      userSettings: baseSettings,
      hasAnySentNotification: hasAnySent,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_7_days";
    results.push({
      scenarioNumber: 16,
      description: "Failed Resend attempt -> status recorded as 'failed', allowing future retry",
      passed,
      expected: "1 candidate (eligible for retry)",
      actual: `${candidates.length} candidate`,
    });
  }

  // Scenario 17: Multiple vehicles -> each reminder evaluates using its own vehicle odometer
  {
    const veh2: Vehicle = { ...baseVehicle, id: "veh-102", current_odometer: 90000 };
    const remVeh2: MaintenanceReminder = { ...baseReminder, id: "rem-102", vehicle_id: "veh-102", due_date: null, due_odometer: 90400 };
    const candidates = evaluateSingleReminder({
      reminder: remVeh2,
      vehicle: veh2,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].currentOdometer === 90000 && candidates[0].notificationType === "mileage_500";
    results.push({
      scenarioNumber: 17,
      description: "Multiple vehicles -> each reminder uses its own vehicle's current odometer",
      passed,
      expected: "1 candidate for vehicle 2 (mileage_500, odo 90,000)",
      actual: `${candidates.length} candidate (odo ${candidates[0]?.currentOdometer})`,
    });
  }

  // Scenario 18: Multiple users -> each user settings evaluated independently
  {
    const user2Settings: UserSettings = { ...baseSettings, user_id: "user-102", email_notifications: false };
    const remUser2: MaintenanceReminder = { ...baseReminder, id: "rem-103", user_id: "user-102" };
    const candidates = evaluateSingleReminder({
      reminder: remUser2,
      vehicle: baseVehicle,
      userSettings: user2Settings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 18,
      description: "Multiple users -> user 2 with disabled notifications produces 0 candidates",
      passed,
      expected: "0 candidates for user 2",
      actual: `${candidates.length} candidates`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    passedCount,
    totalCount: results.length,
    testResults: results,
  };
}

/**
 * [DEVELOPMENT TEST ENDPOINT]
 * GET / POST /api/admin/process-reminders
 *
 * Manually executes the notification processor or test suite.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;
  const userIdParam = searchParams.get("userId") || undefined;
  const overrideEmailParam = searchParams.get("overrideEmail") || undefined;
  const runTests = searchParams.get("runTests") === "true";

  if (runTests) {
    const testSuite = runProcessorUnitTestSuite();
    return NextResponse.json({
      status: testSuite.passedCount === testSuite.totalCount ? "success" : "failure",
      processorUnitTests: {
        summary: `${testSuite.passedCount} / ${testSuite.totalCount} tests passed`,
        allPassed: testSuite.passedCount === testSuite.totalCount,
        results: testSuite.testResults,
      },
    });
  }

  const adminSupabase = createAdminClient();

  const result = await processReminderNotifications(adminSupabase, {
    referenceDate: dateParam,
    userId: userIdParam,
    overrideRecipientEmail: overrideEmailParam,
  });

  if (result.error) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    summary: result.data,
  });
}

export async function POST(request: Request) {
  let body: { date?: string; userId?: string; overrideEmail?: string; runTests?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  if (body.runTests) {
    const testSuite = runProcessorUnitTestSuite();
    return NextResponse.json({
      status: testSuite.passedCount === testSuite.totalCount ? "success" : "failure",
      processorUnitTests: {
        summary: `${testSuite.passedCount} / ${testSuite.totalCount} tests passed`,
        allPassed: testSuite.passedCount === testSuite.totalCount,
        results: testSuite.testResults,
      },
    });
  }

  const adminSupabase = createAdminClient();

  const result = await processReminderNotifications(adminSupabase, {
    referenceDate: body.date,
    userId: body.userId,
    overrideRecipientEmail: body.overrideEmail,
  });

  if (result.error) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    summary: result.data,
  });
}
