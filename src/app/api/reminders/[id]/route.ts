import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReminder, updateReminder, deleteReminder } from "@/lib/services/reminders";
import type { MaintenanceReminderUpdate } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/reminders/[id]
 *
 * Returns a single reminder. RLS enforces that only the owner can fetch it.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getReminder(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * PUT /api/reminders/[id]
 *
 * Updates a reminder. RLS enforces ownership.
 * Body: MaintenanceReminderUpdate
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<MaintenanceReminderUpdate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, reminder_type, status, due_date, due_odometer, description } = body;

  const existingResult = await getReminder(supabase, id);
  if (existingResult.error) {
    return NextResponse.json({ error: existingResult.error }, { status: 404 });
  }

  // Merge with existing record to validate constraints
  const merged = { ...existingResult.data, ...body };
  const hasDueDate = merged.due_date && String(merged.due_date).trim() !== "";
  const hasDueOdometer = merged.due_odometer !== undefined && merged.due_odometer !== null && String(merged.due_odometer).trim() !== "";

  if (!hasDueDate && !hasDueOdometer) {
    return NextResponse.json(
      { error: "Either Due Date or Due Odometer must be provided" },
      { status: 422 }
    );
  }

  const payload: MaintenanceReminderUpdate = {};
  if (title !== undefined) payload.title = title;
  if (reminder_type !== undefined) payload.reminder_type = reminder_type;
  if (status !== undefined) payload.status = status;
  if (description !== undefined) payload.description = description || null;
  if (due_date !== undefined) payload.due_date = hasDueDate ? due_date : null;
  if (due_odometer !== undefined) payload.due_odometer = hasDueOdometer ? Number(due_odometer) : null;

  const result = await updateReminder(supabase, id, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * DELETE /api/reminders/[id]
 *
 * Deletes a reminder. RLS enforces ownership.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteReminder(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
