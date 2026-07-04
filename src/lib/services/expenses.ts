import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseInsert, ExpenseUpdate, ApiResponse } from "@/lib/types";

/**
 * Expenses Service
 *
 * All Supabase queries for the expenses domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
 */

export async function getExpenses(
  supabase: SupabaseClient,
  vehicleId?: string
): Promise<ApiResponse<Expense[]>> {
  let query = supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data: data as Expense[], error: null };
}

export async function getExpense(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<Expense>> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Expense, error: null };
}

export async function createExpense(
  supabase: SupabaseClient,
  userId: string,
  payload: ExpenseInsert
): Promise<ApiResponse<Expense>> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Expense, error: null };
}

export async function updateExpense(
  supabase: SupabaseClient,
  id: string,
  payload: ExpenseUpdate
): Promise<ApiResponse<Expense>> {
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Expense, error: null };
}

export async function deleteExpense(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
