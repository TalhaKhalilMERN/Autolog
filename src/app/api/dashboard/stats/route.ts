import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/services/dashboard";

/**
 * GET /api/dashboard/stats
 *
 * Returns aggregated stats for the authenticated user's dashboard.
 * Requires a valid session — returns 401 if unauthenticated.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getDashboardStats(supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
