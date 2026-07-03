import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRecords, createServiceRecord } from "@/lib/services/service-records";
import type { ServiceRecordInsert } from "@/lib/types";

/**
 * GET /api/service-records
 *
 * Returns all service records belonging to the authenticated user.
 * Optional query parameter: vehicleId to filter by a specific vehicle.
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
  const vehicleId = searchParams.get("vehicleId") || undefined;

  const result = await getServiceRecords(supabase, vehicleId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * POST /api/service-records
 *
 * Creates a new service record for the authenticated user.
 * Body: ServiceRecordInsert (vehicle_id, service_type, service_date, mileage, cost are required; notes, next_service_date, next_service_mileage are optional).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<ServiceRecordInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vehicle_id, service_type, service_date, mileage, cost } = body;

  if (!vehicle_id || !service_type || !service_date || mileage === undefined || cost === undefined) {
    return NextResponse.json(
      { error: "vehicle_id, service_type, service_date, mileage, and cost are required" },
      { status: 422 }
    );
  }

  const result = await createServiceRecord(supabase, user.id, body as ServiceRecordInsert);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
