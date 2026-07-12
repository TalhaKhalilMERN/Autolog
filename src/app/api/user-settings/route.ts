import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings, updateUserSettings } from "@/lib/services/user-settings";
import type { UserSettingsUpdate } from "@/lib/types";

// Validation ranges/values
const VALID_DAYS_BEFORE = [0, 1, 3, 7];
const VALID_ODOMETER_THRESHOLDS = [100, 250, 500, 1000];
const VALID_FREQUENCIES = ["once", "daily"];

/**
 * GET /api/user-settings
 *
 * Retrieves the settings row for the authenticated user.
 * Auto-initializes settings if they do not exist yet.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getUserSettings(supabase, user.id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * PUT /api/user-settings
 *
 * Updates the settings row for the authenticated user.
 * Body: UserSettingsUpdate
 */
export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UserSettingsUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate values if they are provided
  if (
    body.notification_days_before !== undefined &&
    !VALID_DAYS_BEFORE.includes(body.notification_days_before)
  ) {
    return NextResponse.json(
      { error: "notification_days_before must be one of: 0, 1, 3, 7" },
      { status: 422 }
    );
  }

  if (
    body.odometer_threshold !== undefined &&
    !VALID_ODOMETER_THRESHOLDS.includes(body.odometer_threshold)
  ) {
    return NextResponse.json(
      { error: "odometer_threshold must be one of: 100, 250, 500, 1000" },
      { status: 422 }
    );
  }

  if (
    body.notification_frequency !== undefined &&
    !VALID_FREQUENCIES.includes(body.notification_frequency)
  ) {
    return NextResponse.json(
      { error: "notification_frequency must be one of: once, daily" },
      { status: 422 }
    );
  }

  const result = await updateUserSettings(supabase, user.id, body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
