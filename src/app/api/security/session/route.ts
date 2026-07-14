import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSecuritySession } from "@/lib/services/security";

/**
 * GET /api/security/session
 *
 * Returns the current authenticated user's session/security info.
 */
export async function GET() {
  const supabase = await createClient();

  const result = await getSecuritySession(supabase);

  if (result.error) {
    const isAuth = result.error.includes("Not authenticated");
    return NextResponse.json(
      { error: result.error },
      { status: isAuth ? 401 : 500 }
    );
  }

  return NextResponse.json({ data: result.data });
}
