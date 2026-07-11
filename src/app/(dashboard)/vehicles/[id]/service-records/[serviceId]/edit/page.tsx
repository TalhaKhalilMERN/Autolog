"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import {
  useServiceRecord,
  useUpdateServiceRecord,
} from "@/features/vehicles/hooks/use-service-records";
import type { ServiceRecordUpdate, ServiceRecord } from "@/lib/types";

/* ─── Schema ─── */
const serviceRecordSchema = z
  .object({
    service_type: z.string().min(1, "Service type is required").max(100),
    service_date: z.string().min(1, "Service date is required"),
    mileage: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().int().min(0, "Mileage cannot be negative"),
    ),
    cost: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().min(0, "Cost cannot be negative"),
    ),
    notes: z.string().max(500).optional(),
    next_service_date: z.string().optional(),
    next_service_mileage: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().int().min(0, "Mileage cannot be negative").optional(),
    ),
  })
  .refine(
    (data) =>
      data.next_service_mileage === undefined ||
      data.next_service_mileage === null ||
      data.next_service_mileage > (data.mileage ?? 0),
    {
      message: "Next service mileage must be greater than the current service mileage.",
      path: ["next_service_mileage"],
    },
  );

type ServiceRecordFormValues = {
  service_type: string;
  service_date: string;
  mileage: number;
  cost: number;
  notes?: string;
  next_service_date?: string;
  next_service_mileage?: number;
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
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
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

function EditServiceForm({
  vehicleId,
  vehicleName,
  record,
  storedOdometer,
}: {
  vehicleId: string;
  vehicleName: string;
  record: ServiceRecord;
  storedOdometer: number | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const updateServiceMutation = useUpdateServiceRecord();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<ServiceRecordFormValues>({
    resolver: zodResolver(serviceRecordSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
    defaultValues: {
      service_type: record.service_type,
      service_date: record.service_date,
      mileage: record.mileage,
      cost: record.cost,
      notes: record.notes ?? "",
      next_service_date: record.next_service_date ?? "",
      next_service_mileage: record.next_service_mileage ?? undefined,
    },
  });

  // Live-watch the mileage field for the helper / validation message.
  const watchedMileage = useWatch({ control, name: "mileage" });

  const enteredMileage =
    watchedMileage !== undefined &&
    watchedMileage !== null &&
    !Number.isNaN(Number(watchedMileage))
      ? Number(watchedMileage)
      : null;

  /**
   * For edit we compare against the *vehicle's* current_odometer, not the
   * record's own mileage — same rule as create: you can never decrease the
   * vehicle's stored odometer.
   *
   * Edge-case: if the record's own mileage already equals the stored odometer
   * (e.g. this was the last service), "equal" is silent, which is correct.
   */
  const odoState: "lower" | "higher" | "equal" | null =
    storedOdometer !== null && enteredMileage !== null
      ? enteredMileage < storedOdometer
        ? "lower"
        : enteredMileage > storedOdometer
          ? "higher"
          : "equal"
      : null;

  const isSubmitting = updateServiceMutation.isPending;

  async function onSubmit(data: ServiceRecordFormValues) {
    // Extra front-end guard — server will also reject.
    if (storedOdometer !== null && Number(data.mileage) < storedOdometer) {
      setError("mileage", {
        type: "manual",
        message: `Mileage cannot be less than the vehicle's current odometer (${storedOdometer.toLocaleString()} km).`,
      });
      return;
    }

    setServerError(null);

    try {
      const payload: ServiceRecordUpdate = {
        service_type: data.service_type,
        service_date: data.service_date,
        mileage: Number(data.mileage),
        cost: Number(data.cost),
        notes: data.notes || null,
        next_service_date: data.next_service_date || null,
        next_service_mileage:
          data.next_service_mileage !== undefined &&
          data.next_service_mileage !== null &&
          !Number.isNaN(data.next_service_mileage) &&
          String(data.next_service_mileage) !== ""
            ? Number(data.next_service_mileage)
            : null,
      };

      await updateServiceMutation.mutateAsync({ id: record.id, payload });
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to update service record.");
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
        <h2 className="text-xl font-semibold text-foreground">
          Edit Service Record
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the service record details for {vehicleName}.
        </p>

        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 space-y-5"
        >
          {/* Service Type / Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service Type" error={errors.service_type?.message}>
              <input
                {...register("service_type")}
                placeholder="e.g. Oil Change, Tire Rotation"
                className={inputClass(!!errors.service_type)}
              />
            </Field>
            <Field label="Service Date" error={errors.service_date?.message}>
              <input
                {...register("service_date")}
                type="date"
                className={inputClass(!!errors.service_date)}
              />
            </Field>
          </div>

          {/* Odometer / Cost */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mileage field with live helper */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Current Mileage (km)
              </label>
              <input
                {...register("mileage")}
                type="number"
                min={0}
                placeholder="e.g. 50000"
                className={inputClass(!!errors.mileage || odoState === "lower")}
              />
              {/* Validation error (lower than stored vehicle odometer) */}
              {(errors.mileage || odoState === "lower") && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.mileage?.message ||
                    (storedOdometer !== null
                      ? `Mileage cannot be less than the vehicle's current odometer (${storedOdometer.toLocaleString()} km).`
                      : "Invalid mileage.")}
                </p>
              )}
              {/* Info helper (higher than stored — will advance odometer) */}
              {odoState === "higher" &&
                storedOdometer !== null &&
                enteredMileage !== null && (
                  <p className="flex items-center gap-1.5 text-xs text-primary/80">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Saving this service will update the vehicle&apos;s current
                      mileage from{" "}
                      <strong>{storedOdometer.toLocaleString()} km</strong> to{" "}
                      <strong>{enteredMileage.toLocaleString()} km</strong>.
                    </span>
                  </p>
                )}
            </div>

            <Field label="Total Cost ($)" error={errors.cost?.message}>
              <input
                {...register("cost")}
                type="number"
                step="0.01"
                min={0}
                placeholder="e.g. 89.99"
                className={inputClass(!!errors.cost)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes" optional error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              placeholder="e.g. Replaced engine oil and filter, checked fluids..."
              rows={3}
              className={`${inputClass(!!errors.notes)} resize-none`}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Next Service Information */}
          <h3 className="text-sm font-semibold text-foreground">
            Next Service Reminder
          </h3>
          <p className="-mt-3 text-xs text-muted-foreground">
            Optional follow-up suggestion for when this service is due next.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Next Service Date"
              optional
              error={errors.next_service_date?.message}
            >
              <input
                {...register("next_service_date")}
                type="date"
                className={inputClass(!!errors.next_service_date)}
              />
            </Field>
            <Field
              label="Next Service Mileage (km)"
              optional
              error={errors.next_service_mileage?.message}
            >
              <input
                {...register("next_service_mileage")}
                type="number"
                min={0}
                placeholder="e.g. 60000"
                className={inputClass(!!errors.next_service_mileage)}
              />
            </Field>
          </div>

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
              disabled={isSubmitting || odoState === "lower"}
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

export default function EditServiceRecordPage({
  params,
}: {
  params: Promise<{ id: string; serviceId: string }>;
}) {
  const { id: vehicleId, serviceId } = React.use(params);

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(vehicleId);
  const {
    data: record,
    isLoading: recordLoading,
    error: recordError,
  } = useServiceRecord(serviceId);

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
          {recordError?.message || "Service record not found"}
        </div>
      </div>
    );
  }

  const vehicleName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Vehicle";

  return (
    <EditServiceForm
      vehicleId={vehicleId}
      vehicleName={vehicleName}
      record={record}
      storedOdometer={vehicle?.current_odometer ?? null}
    />
  );
}
