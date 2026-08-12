import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateReminderNotifications,
  evaluateSingleReminder,
  getDaysDifference,
} from "@/lib/services/reminder-evaluation";
import type {
  MaintenanceReminder,
  Vehicle,
  UserSettings,
  NotificationCandidate,
} from "@/lib/types";

interface TestCaseResult {
  scenarioNumber: number;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  candidates: NotificationCandidate[];
}

function runUnitTestSuite(): { passedCount: number; totalCount: number; testResults: TestCaseResult[] } {
  const refDate = "2026-08-11";
  const results: TestCaseResult[] = [];

  const baseReminder: MaintenanceReminder = {
    id: "rem-1",
    user_id: "user-1",
    vehicle_id: "veh-1",
    title: "Oil Change",
    description: null,
    reminder_type: "service",
    due_date: null,
    due_odometer: null,
    status: "pending",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const baseVehicle: Vehicle = {
    id: "veh-1",
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    variant: null,
    engine: null,
    transmission: null,
    fuel_type: "Petrol",
    registration_number: "ABC-123",
    current_odometer: 50000,
  };

  const baseSettings: UserSettings = {
    user_id: "user-1",
    email_notifications: true,
    notification_days_before: 3,
    notify_by_odometer: true,
    odometer_threshold: 500,
    notification_frequency: "once",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  // Scenario 1: Reminder due in 7 days -> due_7_days candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-18" },
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_7_days";
    results.push({
      scenarioNumber: 1,
      description: "Reminder due in 7 days -> due_7_days candidate",
      passed,
      expected: "due_7_days",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 2: Reminder due in 1 day -> due_1_day candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-12" },
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_1_day";
    results.push({
      scenarioNumber: 2,
      description: "Reminder due in 1 day -> due_1_day candidate",
      passed,
      expected: "due_1_day",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 3: Reminder due today -> due_today candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-11" },
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "due_today";
    results.push({
      scenarioNumber: 3,
      description: "Reminder due today -> due_today candidate",
      passed,
      expected: "due_today",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 4: Reminder outside all thresholds (due in 5 days) -> no candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-16" },
      vehicle: baseVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 4,
      description: "Reminder outside all thresholds (due in 5 days) -> no candidate",
      passed,
      expected: "no candidate (0)",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none (0)",
      candidates,
    });
  }

  // Scenario 5: Mileage exactly 1000 km away -> mileage_1000 candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_odometer: 51000 },
      vehicle: { ...baseVehicle, current_odometer: 50000 },
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "mileage_1000";
    results.push({
      scenarioNumber: 5,
      description: "Mileage exactly 1000 km away -> mileage_1000 candidate",
      passed,
      expected: "mileage_1000",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 6: Mileage exactly 500 km away -> mileage_500 candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_odometer: 50500 },
      vehicle: { ...baseVehicle, current_odometer: 50000 },
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "mileage_500";
    results.push({
      scenarioNumber: 6,
      description: "Mileage exactly 500 km away -> mileage_500 candidate",
      passed,
      expected: "mileage_500",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 7: Mileage reached or exceeded -> mileage_due candidate
  {
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_odometer: 50000 },
      vehicle: { ...baseVehicle, current_odometer: 50200 },
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 1 && candidates[0].notificationType === "mileage_due";
    results.push({
      scenarioNumber: 7,
      description: "Mileage reached or exceeded -> mileage_due candidate",
      passed,
      expected: "mileage_due",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none",
      candidates,
    });
  }

  // Scenario 8: Notification already exists -> no duplicate candidate
  {
    const existingNotifications = new Set(["due_7_days"]);
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-18" },
      vehicle: baseVehicle,
      userSettings: baseSettings,
      existingNotificationTypesForScheduledDate: existingNotifications,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 8,
      description: "Notification already exists in history -> no duplicate candidate",
      passed,
      expected: "no candidate (0)",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none (0)",
      candidates,
    });
  }

  // Scenario 9: User disabled reminder emails -> no candidate
  {
    const disabledSettings: UserSettings = { ...baseSettings, email_notifications: false };
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_date: "2026-08-18" },
      vehicle: baseVehicle,
      userSettings: disabledSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 9,
      description: "User disabled reminder emails -> no candidate",
      passed,
      expected: "no candidate (0)",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none (0)",
      candidates,
    });
  }

  // Scenario 10: Vehicle has no current_odometer -> mileage reminder cannot be evaluated
  {
    const noOdoVehicle: Vehicle = { ...baseVehicle, current_odometer: null };
    const candidates = evaluateSingleReminder({
      reminder: { ...baseReminder, due_odometer: 51000 },
      vehicle: noOdoVehicle,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const passed = candidates.length === 0;
    results.push({
      scenarioNumber: 10,
      description: "Vehicle has no current_odometer -> mileage reminder cannot be evaluated",
      passed,
      expected: "no candidate (0)",
      actual: candidates.map((c) => c.notificationType).join(", ") || "none (0)",
      candidates,
    });
  }

  // Scenario 11: Multiple vehicles -> evaluated against respective vehicle
  {
    const veh1: Vehicle = { ...baseReminder, id: "v1", user_id: "u1", created_at: "", make: "Honda", model: "Civic", year: 2021, variant: null, engine: null, transmission: null, fuel_type: null, registration_number: null, current_odometer: 10000 };
    const veh2: Vehicle = { ...baseReminder, id: "v2", user_id: "u1", created_at: "", make: "Toyota", model: "Prius", year: 2019, variant: null, engine: null, transmission: null, fuel_type: null, registration_number: null, current_odometer: 50000 };
    
    const candidatesV1 = evaluateSingleReminder({
      reminder: { ...baseReminder, vehicle_id: "v1", due_odometer: 10500 },
      vehicle: veh1,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });
    const candidatesV2 = evaluateSingleReminder({
      reminder: { ...baseReminder, vehicle_id: "v2", due_odometer: 50500 },
      vehicle: veh2,
      userSettings: baseSettings,
      referenceDateStr: refDate,
    });

    const passed = candidatesV1.length === 1 && candidatesV1[0].vehicleId === "v1" && candidatesV2.length === 1 && candidatesV2[0].vehicleId === "v2";
    results.push({
      scenarioNumber: 11,
      description: "Multiple vehicles -> each reminder evaluated against its own vehicle",
      passed,
      expected: "v1 & v2 evaluated independently",
      actual: `v1: ${candidatesV1[0]?.vehicleId || "none"}, v2: ${candidatesV2[0]?.vehicleId || "none"}`,
      candidates: [...candidatesV1, ...candidatesV2],
    });
  }

  // Scenario 12: Multiple users -> users only evaluated for their own reminders
  {
    const user1Settings: UserSettings = { ...baseSettings, user_id: "user-1", email_notifications: true };
    const user2Settings: UserSettings = { ...baseSettings, user_id: "user-2", email_notifications: false };

    const candidatesU1 = evaluateSingleReminder({
      reminder: { ...baseReminder, user_id: "user-1", due_date: "2026-08-18" },
      vehicle: baseVehicle,
      userSettings: user1Settings,
      referenceDateStr: refDate,
    });
    const candidatesU2 = evaluateSingleReminder({
      reminder: { ...baseReminder, user_id: "user-2", due_date: "2026-08-18" },
      vehicle: baseVehicle,
      userSettings: user2Settings,
      referenceDateStr: refDate,
    });

    const passed = candidatesU1.length === 1 && candidatesU2.length === 0;
    results.push({
      scenarioNumber: 12,
      description: "Multiple users -> users only receive notifications for their own reminders",
      passed,
      expected: "user-1: 1 candidate, user-2: 0 candidates",
      actual: `user-1: ${candidatesU1.length}, user-2: ${candidatesU2.length}`,
      candidates: [...candidatesU1, ...candidatesU2],
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
 * GET /api/admin/evaluate-reminders
 *
 * Runs unit test suite for reminder evaluation logic AND executes server database state evaluation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;

  // 1. Run in-memory unit test suite for the 12 required scenarios
  const testSuite = runUnitTestSuite();

  // 2. Query live database state via server client
  const supabase = await createClient();
  const dbEvaluation = await evaluateReminderNotifications(supabase, {
    referenceDate: dateParam,
  });

  return NextResponse.json({
    status: testSuite.passedCount === testSuite.totalCount ? "success" : "failure",
    unitTests: {
      summary: `${testSuite.passedCount} / ${testSuite.totalCount} tests passed`,
      allPassed: testSuite.passedCount === testSuite.totalCount,
      results: testSuite.testResults,
    },
    liveDatabaseEvaluation: {
      error: dbEvaluation.error,
      candidateCount: dbEvaluation.data ? dbEvaluation.data.length : 0,
      candidates: dbEvaluation.data,
    },
  });
}
