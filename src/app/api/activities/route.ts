import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActivities } from "@/lib/services/activities";
import type { ActivityEntityType } from "@/lib/types";

/**
 * GET /api/activities
 *
 * Query parameters:
 *   - page (number, default 1)
 *   - limit (number, default 20)
 *   - entityType (string: 'all', 'vehicle', 'service', 'expense', 'reminder', 'settings', 'security', 'profile')
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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const entityType = (searchParams.get("entityType") as ActivityEntityType | "all") || "all";

  const result = await getActivities(supabase, user.id, {
    page: isNaN(page) ? 1 : page,
    limit: isNaN(limit) ? 20 : limit,
    entityType,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
