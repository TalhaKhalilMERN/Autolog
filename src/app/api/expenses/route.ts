import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExpenses, createExpense } from "@/lib/services/expenses";
import type { ExpenseInsert } from "@/lib/types";

/**
 * GET /api/expenses
 *
 * Returns all expenses belonging to the authenticated user.
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

  const result = await getExpenses(supabase, vehicleId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data });
}

/**
 * POST /api/expenses
 *
 * Creates a new expense record for the authenticated user.
 * Body: ExpenseInsert (vehicle_id, category, title, amount, expense_date, mileage are required; notes is optional).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<ExpenseInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vehicle_id, category, title, amount, expense_date, mileage } = body;

  if (!vehicle_id || !category || !title || amount === undefined || !expense_date || mileage === undefined) {
    return NextResponse.json(
      { error: "vehicle_id, category, title, amount, expense_date, and mileage are required" },
      { status: 422 }
    );
  }

  const result = await createExpense(supabase, user.id, body as ExpenseInsert);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: result.data }, { status: 201 });
}
