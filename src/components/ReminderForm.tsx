"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";

import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import {
  useCreateReminder,
  useUpdateReminder,
  useReminder,
} from "@/features/vehicles/hooks/use-reminders";
import type { MaintenanceReminderInsert, MaintenanceReminderUpdate } from "@/lib/types";

const REMINDER_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Insurance Renewal",
  "Registration",
  "General Service",
  "Filter Replacement",
  "Battery Check",
  "Other",
];

const reminderSchema = z
  .object({
    vehicle_id: z.string().min(1, "Vehicle selection is required"),
    title: z.string().min(1, "Title is required").max(100),
    reminder_type: z.string().min(1, "Type is required"),
    due_date: z.string().optional(),
    due_odometer: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().int().min(0, "Odometer cannot be negative").optional()
    ),
    description: z.string().max(500).optional(),
    status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  })
  .refine((data) => data.due_date || data.due_odometer, {
    message: "Specify at least a due date or due odometer.",
    path: ["due_date"],
  });

type ReminderFormValues = {
  vehicle_id: string;
  title: string;
  reminder_type: string;
  due_date?: string;
  due_odometer?: number;
  description?: string;
  status: "pending" | "completed" | "cancelled";
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

interface ReminderFormProps {
  initialVehicleId?: string;
  reminderId?: string;
}

export function ReminderForm({ initialVehicleId, reminderId }: ReminderFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: existingReminder, isLoading: reminderLoading } = useReminder(reminderId || "");

  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();

  const isEditing = !!reminderId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema) as any,
    mode: "onBlur",
    defaultValues: {
      vehicle_id: initialVehicleId || "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (existingReminder) {
      setValue("vehicle_id", existingReminder.vehicle_id);
      setValue("title", existingReminder.title);
      setValue("reminder_type", existingReminder.reminder_type);
      setValue("due_date", existingReminder.due_date ? existingReminder.due_date.split("T")[0] : "");
      setValue("due_odometer", existingReminder.due_odometer || undefined);
      setValue("description", existingReminder.description || "");
      setValue("status", existingReminder.status);
    } else if (initialVehicleId) {
      setValue("vehicle_id", initialVehicleId);
    }
  }, [existingReminder, initialVehicleId, setValue]);

  async function onSubmit(data: ReminderFormValues) {
    setServerError(null);

    try {
      if (isEditing && reminderId) {
        const payload: MaintenanceReminderUpdate = {
          vehicle_id: data.vehicle_id,
          title: data.title,
          reminder_type: data.reminder_type,
          due_date: data.due_date || null,
          due_odometer: data.due_odometer ? Number(data.due_odometer) : null,
          description: data.description || null,
          status: data.status,
        };
        await updateMutation.mutateAsync({ id: reminderId, payload });
      } else {
        const payload: MaintenanceReminderInsert = {
          vehicle_id: data.vehicle_id,
          title: data.title,
          reminder_type: data.reminder_type,
          due_date: data.due_date || null,
          due_odometer: data.due_odometer ? Number(data.due_odometer) : null,
          description: data.description || null,
          status: data.status,
        };
        await createMutation.mutateAsync(payload);
      }

      router.push("/reminders");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to save reminder.");
    }
  }

  if (vehiclesLoading || (isEditing && reminderLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/reminders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reminders
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Reminder" : "Add Maintenance Reminder"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update reminder details below."
                : "Set a new maintenance alert for your vehicle."}
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

          {/* Title & Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" error={errors.title?.message}>
              <input
                {...register("title")}
                placeholder="e.g. Next Oil Change, Tax Renewal"
                className={inputClass(!!errors.title)}
              />
            </Field>
            <Field label="Reminder Type" error={errors.reminder_type?.message}>
              <select
                {...register("reminder_type")}
                className={`${inputClass(!!errors.reminder_type)} appearance-none`}
              >
                <option value="">Select type</option>
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Due Date & Due Odometer */}
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

          {/* Status (if editing) */}
          {isEditing && (
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
          )}

          {/* Description */}
          <Field label="Description" optional error={errors.description?.message}>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Additional details about this maintenance item..."
              className={`${inputClass(!!errors.description)} resize-none`}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/reminders"
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
                "Update Reminder"
              ) : (
                "Save Reminder"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
