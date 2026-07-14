import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { changePassword } from "@/lib/services/security";

/**
 * POST /api/security/change-password
 *
 * Changes the authenticated user's password.
 * Body: { new_password: string }
 *
 * NOTE: Supabase does not verify the current password before updating.
 * The current_password field exists in the UI for UX purposes only.
 * See the TODO in the service layer for the proper re-auth approach.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { new_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { new_password } = body;

  if (!new_password || typeof new_password !== "string") {
    return NextResponse.json({ error: "new_password is required." }, { status: 422 });
  }
  if (new_password.length < 8 || new_password.length > 72) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters." },
      { status: 422 }
    );
  }
  if (!/[A-Z]/.test(new_password)) {
    return NextResponse.json(
      { error: "Password must contain at least one uppercase letter." },
      { status: 422 }
    );
  }
  if (!/[0-9]/.test(new_password)) {
    return NextResponse.json(
      { error: "Password must contain at least one number." },
      { status: 422 }
    );
  }

  const result = await changePassword(supabase, new_password);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
