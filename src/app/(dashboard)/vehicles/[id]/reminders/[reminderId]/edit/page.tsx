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
import { useReminder, useUpdateReminder } from "@/features/vehicles/hooks/use-reminders";
import type { MaintenanceReminder, MaintenanceReminderUpdate } from "@/lib/types";

/* ─── Schema ─── */
const reminderSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title must be at most 100 characters"),
    reminder_type: z.string().min(1, "Reminder type is required"),
    description: z.string().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
    due_date: z.string().optional().or(z.literal("")),
    due_odometer: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().int().min(0, "Due Odometer cannot be negative").optional()
    ),
    status: z.enum(["pending", "completed", "cancelled"]),
  })
  .refine(
    (data) => {
      const hasDate = data.due_date && data.due_date.trim() !== "";
      const hasOdo = data.due_odometer !== undefined && data.due_odometer !== null && String(data.due_odometer).trim() !== "";
      return hasDate || hasOdo;
    },
    {
      message: "You must provide either a Due Date or a Due Odometer",
      path: ["due_date"],
    }
  );

type ReminderFormValues = {
  title: string;
  reminder_type: string;
  description?: string;
  due_date?: string;
  due_odometer?: number;
  status: "pending" | "completed" | "cancelled";
};

const REMINDER_TYPES = [
  "Oil Change",
  "Brake Pads",
  "Air Filter",
  "Cabin Filter",
  "Tyre Rotation",
  "Battery",
  "Timing Belt",
  "Registration",
  "Insurance",
  "Inspection",
  "General Maintenance",
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

function EditReminderForm({
  vehicleId,
  vehicleName,
  record,
}: {
  vehicleId: string;
  vehicleName: string;
  record: MaintenanceReminder;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const updateReminderMutation = useUpdateReminder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema) as any,
    mode: "onBlur",
    defaultValues: {
      title: record.title,
      reminder_type: record.reminder_type,
      description: record.description ?? "",
      due_date: record.due_date ?? "",
      due_odometer: record.due_odometer ?? undefined,
      status: record.status,
    },
  });

  const isSubmitting = updateReminderMutation.isPending;

  async function onSubmit(data: ReminderFormValues) {
    setServerError(null);

    try {
      const payload: MaintenanceReminderUpdate = {
        title: data.title,
        reminder_type: data.reminder_type,
        status: data.status,
        description: data.description || null,
        due_date: data.due_date && data.due_date.trim() !== "" ? data.due_date : null,
        due_odometer:
          data.due_odometer !== undefined &&
          data.due_odometer !== null &&
          !Number.isNaN(data.due_odometer) &&
          String(data.due_odometer).trim() !== ""
            ? Number(data.due_odometer)
            : null,
      };

      await updateReminderMutation.mutateAsync({ id: record.id, payload });
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to update reminder.");
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
        <h2 className="text-xl font-semibold text-foreground">Edit Reminder</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update maintenance reminder details for {vehicleName}.
        </p>

        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          {/* Vehicle (Read-only) / Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle">
              <input
                type="text"
                disabled
                value={vehicleName}
                className={`${inputClass(false)} opacity-60 bg-muted cursor-not-allowed`}
              />
            </Field>
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g. Next oil change"
                className={inputClass(!!errors.title)}
              />
            </Field>
          </div>

          {/* Reminder Type / Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reminder Type" error={errors.reminder_type?.message}>
              <select
                {...register("reminder_type")}
                className={`${inputClass(!!errors.reminder_type)} appearance-none`}
              >
                <option value="">Select type</option>
                {REMINDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select
                {...register("status")}
                className={`${inputClass(!!errors.status)} appearance-none`}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          </div>

          {/* Due Date / Due Odometer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due Date" optional error={errors.due_date?.message}>
              <input
                {...register("due_date")}
                type="date"
                className={inputClass(!!errors.due_date)}
              />
            </Field>
            <Field label="Due Odometer (km)" optional error={errors.due_odometer?.message}>
              <input
                {...register("due_odometer")}
                type="number"
                min={0}
                placeholder="e.g. 60000"
                className={inputClass(!!errors.due_odometer)}
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" optional error={errors.description?.message}>
            <textarea
              {...register("description")}
              placeholder="e.g. Use 5W-30 synthetic oil and replace oil filter..."
              rows={3}
              className={`${inputClass(!!errors.description)} resize-none`}
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

export default function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string; reminderId: string }>;
}) {
  const { id: vehicleId, reminderId } = React.use(params);

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId);
  const { data: record, isLoading: recordLoading, error: recordError } = useReminder(reminderId);

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
          {recordError?.message || "Reminder not found"}
        </div>
      </div>
    );
  }

  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle";

  return <EditReminderForm vehicleId={vehicleId} vehicleName={vehicleName} record={record} />;
}
