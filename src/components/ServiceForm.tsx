"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Wrench, Info } from "lucide-react";
import Link from "next/link";

import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import {
  useCreateServiceRecord,
  useUpdateServiceRecord,
  useServiceRecord,
} from "@/features/vehicles/hooks/use-service-records";
import type { ServiceRecordInsert, ServiceRecordUpdate } from "@/lib/types";

const serviceRecordSchema = z
  .object({
    vehicle_id: z.string().min(1, "Vehicle selection is required"),
    service_type: z.string().min(1, "Service type is required").max(100),
    service_date: z.string().min(1, "Service date is required"),
    mileage: z.coerce.number().int().min(0, "Mileage cannot be negative"),
    cost: z.coerce.number().min(0, "Cost cannot be negative"),
    notes: z.string().max(500).optional(),
    next_service_date: z.string().optional(),
    next_service_mileage: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number().int().min(0, "Mileage cannot be negative").optional()
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
    }
  );

type ServiceRecordFormValues = {
  vehicle_id: string;
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

interface ServiceFormProps {
  initialVehicleId?: string;
  recordId?: string;
}

export function ServiceForm({ initialVehicleId, recordId }: ServiceFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: existingRecord, isLoading: recordLoading } = useServiceRecord(recordId || "");

  const createMutation = useCreateServiceRecord();
  const updateMutation = useUpdateServiceRecord();

  const isEditing = !!recordId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ServiceRecordFormValues>({
    resolver: zodResolver(serviceRecordSchema) as any,
    mode: "onBlur",
    defaultValues: {
      vehicle_id: initialVehicleId || "",
      service_date: todayStr,
    },
  });

  useEffect(() => {
    if (existingRecord) {
      setValue("vehicle_id", existingRecord.vehicle_id);
      setValue("service_type", existingRecord.service_type);
      setValue("service_date", existingRecord.service_date ? existingRecord.service_date.split("T")[0] : todayStr);
      setValue("mileage", existingRecord.mileage);
      setValue("cost", existingRecord.cost);
      setValue("notes", existingRecord.notes || "");
      setValue("next_service_date", existingRecord.next_service_date || "");
      setValue("next_service_mileage", existingRecord.next_service_mileage || undefined);
    } else if (initialVehicleId) {
      setValue("vehicle_id", initialVehicleId);
      const vehicle = vehicles.find((v) => v.id === initialVehicleId);
      if (vehicle?.current_odometer) {
        setValue("mileage", vehicle.current_odometer);
      }
    }
  }, [existingRecord, initialVehicleId, vehicles, setValue, todayStr]);

  const watchedVehicleId = useWatch({ control, name: "vehicle_id" });
  const watchedMileage = useWatch({ control, name: "mileage" });

  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);
  const storedOdometer = selectedVehicle?.current_odometer ?? null;
  const enteredMileage =
    watchedMileage !== undefined && watchedMileage !== null && !Number.isNaN(Number(watchedMileage))
      ? Number(watchedMileage)
      : null;

  const odoState: "lower" | "higher" | "equal" | null =
    storedOdometer !== null && enteredMileage !== null
      ? enteredMileage < storedOdometer
        ? "lower"
        : enteredMileage > storedOdometer
          ? "higher"
          : "equal"
      : null;

  async function onSubmit(data: ServiceRecordFormValues) {
    setServerError(null);

    try {
      if (isEditing && recordId) {
        const payload: ServiceRecordUpdate = {
          vehicle_id: data.vehicle_id,
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
        await updateMutation.mutateAsync({ id: recordId, payload });
      } else {
        const payload: ServiceRecordInsert = {
          vehicle_id: data.vehicle_id,
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
        await createMutation.mutateAsync(payload);
      }

      router.push("/services");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to save service record.");
    }
  }

  if (vehiclesLoading || (isEditing && recordLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
            <Wrench className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Service Record" : "Add Service Record"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update your service record details below."
                : "Record a maintenance event for your vehicle."}
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

          {/* Service Type & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service Type" error={errors.service_type?.message}>
              <input
                {...register("service_type")}
                placeholder="e.g. Oil Change, Brake Service"
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

          {/* Odometer & Cost */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Current Mileage (km)</label>
              <input
                {...register("mileage")}
                type="number"
                min={0}
                placeholder="e.g. 50000"
                className={inputClass(!!errors.mileage)}
              />
              {errors.mileage && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.mileage.message}
                </p>
              )}
              {odoState === "lower" && storedOdometer !== null && enteredMileage !== null && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>
                    Historical entry — vehicle overall odometer will remain at <strong>{storedOdometer.toLocaleString()} km</strong>.
                  </span>
                </p>
              )}
              {odoState === "higher" && storedOdometer !== null && enteredMileage !== null && (
                <p className="flex items-center gap-1.5 text-xs text-primary/80">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Will advance vehicle overall odometer from <strong>{storedOdometer.toLocaleString()} km</strong> to <strong>{enteredMileage.toLocaleString()} km</strong>.
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
                placeholder="e.g. 120.00"
                className={inputClass(!!errors.cost)}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes" optional error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="e.g. Replaced engine oil filter and synthetic 5W-30 oil..."
              className={`${inputClass(!!errors.notes)} resize-none`}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Next Service Information */}
          <h3 className="text-sm font-semibold text-foreground">Next Service Reminder (Optional)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Next Service Date" optional error={errors.next_service_date?.message}>
              <input
                {...register("next_service_date")}
                type="date"
                className={inputClass(!!errors.next_service_date)}
              />
            </Field>
            <Field label="Next Service Mileage (km)" optional error={errors.next_service_mileage?.message}>
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
              href="/services"
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
                "Update Service Record"
              ) : (
                "Save Service Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
