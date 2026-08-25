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

export interface GetExpensesOptions {
  vehicleId?: string;
  search?: string;
  category?: string;
  sort?: "desc" | "asc";
  page?: number;
  limit?: number;
}

export interface PaginatedExpensesResult {
  expenses: Expense[];
  totalCount: number;
  totalAmount: number;
}

export async function getExpenses(
  supabase: SupabaseClient,
  optionsOrVehicleId?: string | GetExpensesOptions
): Promise<ApiResponse<Expense[] | PaginatedExpensesResult>> {
  let vehicleId: string | undefined;
  let search: string | undefined;
  let category: string | undefined;
  let sort: "desc" | "asc" = "desc";
  let page: number | undefined;
  let limit: number | undefined;

  if (typeof optionsOrVehicleId === "string") {
    vehicleId = optionsOrVehicleId;
  } else if (optionsOrVehicleId) {
    vehicleId = optionsOrVehicleId.vehicleId;
    search = optionsOrVehicleId.search;
    category = optionsOrVehicleId.category;
    sort = optionsOrVehicleId.sort || "desc";
    page = optionsOrVehicleId.page;
    limit = optionsOrVehicleId.limit;
  }

  let query = supabase.from("expenses").select("*", { count: "exact" });

  if (vehicleId && vehicleId !== "all") {
    query = query.eq("vehicle_id", vehicleId);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`title.ilike.%${term}%,notes.ilike.%${term}%,category.ilike.%${term}%`);
  }

  query = query
    .order("expense_date", { ascending: sort === "asc" })
    .order("created_at", { ascending: sort === "asc" });

  if (page && limit) {
    // For aggregated total amount across filtered results
    const { data: allMatching } = await query;
    const totalAmount = ((allMatching as Expense[]) || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) return { data: null, error: error.message };

    return {
      data: {
        expenses: (data as Expense[]) || [],
        totalCount: count ?? 0,
        totalAmount,
      },
      error: null,
    };
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
