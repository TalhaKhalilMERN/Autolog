import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/services/analytics";

/**
 * GET /api/dashboard/analytics
 *
 * Lightweight aggregated analytics endpoint powering the 4 dashboard charts.
 * Protected via Supabase Auth server session.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getDashboardAnalytics(supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
