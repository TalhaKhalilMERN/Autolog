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
import { useExpense, useUpdateExpense } from "@/features/vehicles/hooks/use-expenses";
import type { ExpenseUpdate, Expense } from "@/lib/types";

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

function EditExpenseForm({
  vehicleId,
  vehicleName,
  record,
}: {
  vehicleId: string;
  vehicleName: string;
  record: Expense;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const updateExpenseMutation = useUpdateExpense();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
    defaultValues: {
      category: record.category,
      title: record.title,
      expense_date: record.expense_date,
      mileage: record.mileage,
      amount: record.amount,
      notes: record.notes ?? "",
    },
  });

  const isSubmitting = updateExpenseMutation.isPending;
  const isLinkedToService = !!record.service_record_id;

  async function onSubmit(data: ExpenseFormValues) {
    setServerError(null);

    try {
      const payload: ExpenseUpdate = {
        category: data.category,
        title: data.title,
        amount: Number(data.amount),
        expense_date: data.expense_date,
        mileage: Number(data.mileage),
        notes: data.notes || null,
      };

      await updateExpenseMutation.mutateAsync({ id: record.id, payload });
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to update expense record.");
    }
  }

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
        <h2 className="text-xl font-semibold text-foreground">Edit Expense</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update expense record details for {vehicleName}.
        </p>

        {isLinkedToService && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning leading-relaxed">
            <strong>Note:</strong> This expense is automatically linked to a Service Record. Any updates made here will not change the original Service Record. To synchronize both, consider updating the Service Record instead.
          </div>
        )}

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
                disabled={isLinkedToService}
                className={`${inputClass(!!errors.category)} appearance-none disabled:opacity-60`}
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
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { id: vehicleId, expenseId } = React.use(params);

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId);
  const { data: record, isLoading: recordLoading, error: recordError } = useExpense(expenseId);

  if (vehicleLoading || recordLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (recordError || !record) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/vehicles/${vehicleId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicle details
        </Link>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {recordError?.message || "Expense record not found"}
        </div>
      </div>
    );
  }

  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle";

  return <EditExpenseForm vehicleId={vehicleId} vehicleName={vehicleName} record={record} />;
}
