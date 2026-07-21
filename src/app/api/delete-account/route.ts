import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/delete-account
 *
 * Permanently deletes the authenticated user's account from Supabase Auth.
 * ON DELETE CASCADE on all foreign keys means associated data is removed
 * automatically:
 *   - user_settings
 *   - vehicles (→ service_records, expenses, maintenance_reminders)
 *
 * The admin client (service role) is required because the regular client
 * cannot delete auth users. The request user is verified first to prevent
 * deleting any other user's account.
 */
export async function POST() {

  // 1. Verify the currently authenticated user using the cookie-based client.
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Use the admin client to delete the verified user's auth account.
  //    This is server-only — the Service Role Key is never sent to the client.
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err: any) {
    console.error("[delete-account] Admin client init failed:", err.message);
    return NextResponse.json(
      { error: "Server configuration error. Please contact support." },
      { status: 500 }
    );
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[delete-account] Delete failed:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
