import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "@/lib/types";

/**
 * Hook to fetch all expenses, optionally filtered by vehicle ID.
 * Query key: ["expenses"] or ["expenses", { vehicleId }]
 */
export function useExpenses(vehicleId?: string) {
  return useQuery<Expense[], Error>({
    queryKey: vehicleId ? ["expenses", { vehicleId }] : ["expenses"],
    queryFn: async () => {
      const url = vehicleId
        ? `/api/expenses?vehicleId=${encodeURIComponent(vehicleId)}`
        : "/api/expenses";
      const res = await fetch(url);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch expenses");
      }
      const json = await res.json();
      return json.data;
    },
  });
}

/**
 * Hook to fetch a single expense by ID.
 * Query key: ["expense", id]
 */
export function useExpense(id: string) {
  return useQuery<Expense, Error>({
    queryKey: ["expense", id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to fetch expense");
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new expense.
 * On success, invalidates queryKey: ["expenses"]
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, ExpenseInsert>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to create expense");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      // Invalidate dashboard stats since total expenses change
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to update an existing expense.
 * On success, invalidates queryKey: ["expenses"] and ["expense", id]
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: string; payload: ExpenseUpdate }>({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to update expense");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/**
 * Hook to delete an expense.
 * On success, invalidates queryKey: ["expenses"]
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to delete expense");
      }
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
