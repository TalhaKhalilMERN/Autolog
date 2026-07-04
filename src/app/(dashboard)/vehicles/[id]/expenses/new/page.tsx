"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import { useCreateExpense } from "@/features/vehicles/hooks/use-expenses";
import type { ExpenseInsert } from "@/lib/types";

/* ─── Schema ─── */
const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(100),
  expense_date: z.string().min(1, "Expense date is required"),
  mileage: z.coerce
    .number()
    .int()
    .min(0, "Mileage cannot be negative"),
  amount: z.coerce
    .number()
    .min(0, "Amount cannot be negative"),
  notes: z.string().max(500).optional(),
});

type ExpenseFormValues = {
  category: string;
  title: string;
  expense_date: string;
  mileage: number;
  amount: number;
  notes?: string;
};

const CATEGORIES = [
  "Fuel",
  "Insurance",
  "Registration",
  "Parking",
  "Car Wash",
  "Accessories",
  "Tax",
  "Fine",
  "Service",
  "Other",
];

function Field({
  label,
  error,
  children,
  optional,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:border-primary ${
    hasError
      ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
      : "border-border focus:ring-primary/30"
  }`;

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: vehicleId } = React.use(params);
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId);
  const createExpenseMutation = useCreateExpense();

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
    defaultValues: {
      expense_date: today,
    },
  });

  const isSubmitting = createExpenseMutation.isPending;

  async function onSubmit(data: ExpenseFormValues) {
    setServerError(null);

    try {
      const payload: ExpenseInsert = {
        vehicle_id: vehicleId,
        service_record_id: null,
        category: data.category,
        title: data.title,
        amount: Number(data.amount),
        expense_date: data.expense_date,
        mileage: Number(data.mileage),
        notes: data.notes || null,
      };

      await createExpenseMutation.mutateAsync(payload);
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to add expense record.");
    }
  }

  if (vehicleLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href={`/vehicles/${vehicleId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {vehicleName}
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Add Expense</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Log a vehicle expense (fuel, insurance, parking, fine, etc.) for {vehicleName}.
        </p>

        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          {/* Category / Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <select
                {...register("category")}
                className={`${inputClass(!!errors.category)} appearance-none`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g. Fuel up, Monthly Premium"
                className={inputClass(!!errors.title)}
              />
            </Field>
          </div>

          {/* Odometer / Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current Mileage (km)" error={errors.mileage?.message}>
              <input
                {...register("mileage")}
                type="number"
                min={0}
                placeholder="e.g. 50500"
                className={inputClass(!!errors.mileage)}
              />
            </Field>
            <Field label="Total Amount ($)" error={errors.amount?.message}>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                min={0}
                placeholder="e.g. 45.50"
                className={inputClass(!!errors.amount)}
              />
            </Field>
          </div>

          {/* Expense Date */}
          <Field label="Expense Date" error={errors.expense_date?.message}>
            <input
              {...register("expense_date")}
              type="date"
              className={inputClass(!!errors.expense_date)}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes" optional error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              placeholder="e.g. Shell stations petrol premium..."
              rows={3}
              className={`${inputClass(!!errors.notes)} resize-none`}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/vehicles/${vehicleId}`}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
