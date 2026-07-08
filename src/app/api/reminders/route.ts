import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReminders, createReminder } from "@/lib/services/reminders";
import type { MaintenanceReminderInsert } from "@/lib/types";

/**
 * GET /api/reminders
 *
 * Returns all maintenance reminders belonging to the authenticated user.
 * Optional query parameter: vehicleId to filter by a specific vehicle.
 * Supabase RLS ensures only owned rows are returned.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId") || undefined;

  const result = await getReminders(supabase, vehicleId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * POST /api/reminders
 *
 * Creates a new maintenance reminder for the authenticated user.
 * Body: MaintenanceReminderInsert (vehicle_id, title, reminder_type, status are required; description, due_date, due_odometer are optional).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<MaintenanceReminderInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vehicle_id, title, reminder_type, status, due_date, due_odometer, description } = body;

  if (!vehicle_id || !title || !reminder_type || !status) {
    return NextResponse.json(
      { error: "vehicle_id, title, reminder_type, and status are required" },
      { status: 422 }
    );
  }

  // Reject if both due_date and due_odometer are empty
  const hasDueDate = due_date && String(due_date).trim() !== "";
  const hasDueOdometer = due_odometer !== undefined && due_odometer !== null && String(due_odometer).trim() !== "";

  if (!hasDueDate && !hasDueOdometer) {
    return NextResponse.json(
      { error: "Either Due Date or Due Odometer must be provided" },
      { status: 422 }
    );
  }

  const payload: MaintenanceReminderInsert = {
    vehicle_id,
    title,
    reminder_type,
    status,
    description: description || null,
    due_date: hasDueDate ? due_date : null,
    due_odometer: hasDueOdometer ? Number(due_odometer) : null,
  };

  const result = await createReminder(supabase, user.id, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
