import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listVehicles, createVehicle } from "@/lib/services/vehicles";
import type { VehicleInsert } from "@/lib/types";

/**
 * GET /api/vehicles
 *
 * Returns all vehicles belonging to the authenticated user.
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
  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");
  const search = searchParams.get("search") || undefined;
  const fuelType = searchParams.get("fuelType") || undefined;
  const sort = (searchParams.get("sort") as any) || undefined;

  const page = pageStr ? parseInt(pageStr, 10) : undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  const result = await listVehicles(supabase, {
    page,
    limit,
    search,
    fuelType,
    sort,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * POST /api/vehicles
 *
 * Creates a new vehicle for the authenticated user.
 * Body: VehicleInsert (make, model, year are required; all others optional).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<VehicleInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { make, model, year } = body;

  if (!make || !model || !year) {
    return NextResponse.json(
      { error: "make, model, and year are required" },
      { status: 422 }
    );
  }

  const result = await createVehicle(supabase, user.id, body as VehicleInsert);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
