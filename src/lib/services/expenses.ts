import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseInsert, ExpenseUpdate, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/services/activities";

/**
 * Expenses Service
 *
 * All Supabase queries for the expenses domain live here.
 * Both Server Components and API Route Handlers consume these functions.
 * RLS on the Supabase side enforces ownership.
 * Automatically logs activities on CRUD events.
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

  const expense = data as Expense;

  // Log activity only for manually created expenses (service record auto-sync logs its own activity)
  if (!payload.service_record_id) {
    const amtStr = `$${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    await logActivity(supabase, {
      userId,
      entityType: "expense",
      entityId: expense.id,
      action: "created",
      title: "Expense Added",
      description: `${expense.title} expense of ${amtStr} added.`,
      metadata: {
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        mileage: expense.mileage,
      },
      iconType: "expense",
    });
  }

  return { data: expense, error: null };
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

  const expense = data as Expense;

  await logActivity(supabase, {
    userId: expense.user_id,
    entityType: "expense",
    entityId: expense.id,
    action: "updated",
    title: "Expense Updated",
    description: `Updated expense "${expense.title}".`,
    metadata: {
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
    },
    iconType: "expense",
  });

  return { data: expense, error: null };
}

export async function deleteExpense(
  supabase: SupabaseClient,
  id: string
): Promise<ApiResponse<{ id: string }>> {
  const { data: expense } = await supabase
    .from("expenses")
    .select("user_id, title, amount")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) return { data: null, error: error.message };

  if (expense) {
    await logActivity(supabase, {
      userId: expense.user_id,
      entityType: "expense",
      entityId: id,
      action: "deleted",
      title: "Expense Deleted",
      description: `Removed expense "${expense.title}".`,
      metadata: { title: expense.title, amount: expense.amount },
      iconType: "expense",
    });
  }

  return { data: { id }, error: null };
}
