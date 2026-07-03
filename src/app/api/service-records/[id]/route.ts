import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRecord, updateServiceRecord, deleteServiceRecord } from "@/lib/services/service-records";
import type { ServiceRecordUpdate } from "@/lib/types";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/service-records/[id]
 *
 * Returns a single service record. RLS enforces that only the owner can fetch it.
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

  const result = await getServiceRecord(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * PUT /api/service-records/[id]
 *
 * Updates a service record. RLS enforces ownership.
 * Body: ServiceRecordUpdate
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

  let body: ServiceRecordUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await updateServiceRecord(supabase, id, body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * DELETE /api/service-records/[id]
 *
 * Deletes a service record. RLS enforces ownership.
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

  const result = await deleteServiceRecord(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
