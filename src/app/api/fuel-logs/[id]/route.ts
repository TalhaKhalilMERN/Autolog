import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFuelLog, updateFuelLog, deleteFuelLog } from "@/lib/services/fuel-logs";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/fuel-logs/[id]
 *
 * Returns a single fuel log by ID. RLS enforces user ownership.
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

  const result = await getFuelLog(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ data: result.data });
}

const fuelLogUpdateSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID").optional(),
  log_date: z.string().min(1, "Date is required").optional(),
  odometer: z.number().int().min(0, "Odometer must be non-negative").optional(),
  liters: z.number().positive("Liters must be greater than 0").optional(),
  price_per_liter: z.number().positive("Price per liter must be greater than 0").optional(),
  total_cost: z.number().positive("Total cost must be greater than 0").optional(),
  fuel_type: z.string().max(50).nullable().optional(),
  fuel_station: z.string().max(100).nullable().optional(),
  is_full_tank: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

/**
 * PUT /api/fuel-logs/[id]
 *
 * Updates an existing fuel log by ID.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = fuelLogUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join("; ");
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const result = await updateFuelLog(supabase, id, parsed.data);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * DELETE /api/fuel-logs/[id]
 *
 * Deletes a fuel log by ID.
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

  const result = await deleteFuelLog(supabase, id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}
