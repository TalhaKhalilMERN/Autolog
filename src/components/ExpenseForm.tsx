"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";

import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import {
  useCreateExpense,
  useUpdateExpense,
  useExpense,
} from "@/features/vehicles/hooks/use-expenses";
import type { ExpenseInsert, ExpenseUpdate } from "@/lib/types";

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

const expenseSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(100),
  expense_date: z.string().min(1, "Expense date is required"),
  mileage: z.coerce.number().int().min(0, "Mileage cannot be negative"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  notes: z.string().max(500).optional(),
});

type ExpenseFormValues = {
  vehicle_id: string;
  category: string;
  title: string;
  expense_date: string;
  mileage: number;
  amount: number;
  notes?: string;
};

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

interface ExpenseFormProps {
  initialVehicleId?: string;
  expenseId?: string;
}

export function ExpenseForm({ initialVehicleId, expenseId }: ExpenseFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: existingExpense, isLoading: expenseLoading } = useExpense(expenseId || "");

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const isEditing = !!expenseId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    mode: "onBlur",
    defaultValues: {
      vehicle_id: initialVehicleId || "",
      expense_date: todayStr,
    },
  });

  useEffect(() => {
    if (existingExpense) {
      setValue("vehicle_id", existingExpense.vehicle_id);
      setValue("category", existingExpense.category);
      setValue("title", existingExpense.title);
      setValue("expense_date", existingExpense.expense_date ? existingExpense.expense_date.split("T")[0] : todayStr);
      setValue("mileage", existingExpense.mileage);
      setValue("amount", existingExpense.amount);
      setValue("notes", existingExpense.notes || "");
    } else if (initialVehicleId) {
      setValue("vehicle_id", initialVehicleId);
      const vehicle = vehicles.find((v) => v.id === initialVehicleId);
      if (vehicle?.current_odometer) {
        setValue("mileage", vehicle.current_odometer);
      }
    }
  }, [existingExpense, initialVehicleId, vehicles, setValue, todayStr]);

  const watchedVehicleId = useWatch({ control, name: "vehicle_id" });
  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);

  async function onSubmit(data: ExpenseFormValues) {
    setServerError(null);

    try {
      if (isEditing && expenseId) {
        const payload: ExpenseUpdate = {
          vehicle_id: data.vehicle_id,
          category: data.category,
          title: data.title,
          amount: Number(data.amount),
          expense_date: data.expense_date,
          mileage: Number(data.mileage),
          notes: data.notes || null,
        };
        await updateMutation.mutateAsync({ id: expenseId, payload });
      } else {
        const payload: ExpenseInsert = {
          vehicle_id: data.vehicle_id,
          service_record_id: null,
          category: data.category,
          title: data.title,
          amount: Number(data.amount),
          expense_date: data.expense_date,
          mileage: Number(data.mileage),
          notes: data.notes || null,
        };
        await createMutation.mutateAsync(payload);
      }

      router.push("/expenses");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to save expense.");
    }
  }

  if (vehiclesLoading || (isEditing && expenseLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/expenses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to expenses
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Expense" : "Add Expense"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update expense details below."
                : "Log a vehicle expense (fuel, insurance, parking, fine, etc.)."}
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          {/* Vehicle Select */}
          <Field label="Vehicle" error={errors.vehicle_id?.message}>
            <select
              {...register("vehicle_id")}
              className={`${inputClass(!!errors.vehicle_id)} appearance-none`}
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} {v.registration_number ? `(${v.registration_number})` : ""}
                </option>
              ))}
            </select>
          </Field>

          {/* Category & Title */}
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
                placeholder="e.g. Fuel up, Annual Insurance"
                className={inputClass(!!errors.title)}
              />
            </Field>
          </div>

          {/* Odometer & Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current Mileage (km)" error={errors.mileage?.message}>
              <input
                {...register("mileage")}
                type="number"
                min={0}
                placeholder={selectedVehicle?.current_odometer ? `Current: ${selectedVehicle.current_odometer}` : "e.g. 50000"}
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

          {/* Date */}
          <Field label="Expense Date" error={errors.expense_date?.message}>
            <input
              {...register("expense_date")}
              type="date"
              max={todayStr}
              className={inputClass(!!errors.expense_date)}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes" optional error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="e.g. Shell stations petrol premium..."
              className={`${inputClass(!!errors.notes)} resize-none`}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/expenses"
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
              ) : isEditing ? (
                "Update Expense"
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
