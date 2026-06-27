import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVehicle, updateVehicle, deleteVehicle } from "@/lib/services/vehicles";
import type { VehicleInsert } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/vehicles/[id]
 *
 * Returns a single vehicle. RLS enforces that only the owner can fetch it.
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

  const result = await getVehicle(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * PUT /api/vehicles/[id]
 *
 * Updates a vehicle. RLS enforces ownership.
 * Body: Partial<VehicleInsert>
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

  let body: Partial<VehicleInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await updateVehicle(supabase, id, body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * DELETE /api/vehicles/[id]
 *
 * Deletes a vehicle. RLS enforces ownership.
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

  const result = await deleteVehicle(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
