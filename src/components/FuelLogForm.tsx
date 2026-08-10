"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Fuel, Info } from "lucide-react";
import Link from "next/link";

import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { useCreateFuelLog, useUpdateFuelLog, useFuelLog } from "@/features/vehicles/hooks/use-fuel-logs";
import type { FuelLogInsert, FuelLogUpdate } from "@/lib/types";

const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "Plugin Hybrid", "CNG", "LPG"];

const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  log_date: z.string().min(1, "Date is required"),
  odometer: z.coerce.number().int().min(0, "Odometer must be non-negative"),
  liters: z.coerce.number().positive("Liters must be greater than 0"),
  price_per_liter: z.coerce.number().positive("Price per liter must be greater than 0"),
  fuel_type: z.string().optional(),
  fuel_station: z.string().max(100).optional(),
  is_full_tank: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

type FuelLogFormValues = {
  vehicle_id: string;
  log_date: string;
  odometer: number;
  liters: number;
  price_per_liter: number;
  fuel_type?: string;
  fuel_station?: string;
  is_full_tank: boolean;
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
  `w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:border-primary ${hasError
    ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
    : "border-border focus:ring-primary/30"
  }`;

interface FuelLogFormProps {
  initialVehicleId?: string;
  logId?: string;
}

export function FuelLogForm({ initialVehicleId, logId }: FuelLogFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: existingLog, isLoading: logLoading } = useFuelLog(logId || "");

  const createMutation = useCreateFuelLog();
  const updateMutation = useUpdateFuelLog();

  const isEditing = !!logId;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema) as any,
    mode: "onBlur",
    defaultValues: {
      vehicle_id: initialVehicleId || "",
      log_date: todayStr,
      is_full_tank: false,
    },
  });

  // Populate values when editing or when vehicles load
  useEffect(() => {
    if (existingLog) {
      setValue("vehicle_id", existingLog.vehicle_id);
      setValue("log_date", existingLog.log_date ? existingLog.log_date.split("T")[0] : todayStr);
      setValue("odometer", existingLog.odometer);
      setValue("liters", existingLog.liters);
      setValue("price_per_liter", existingLog.price_per_liter);
      setValue("fuel_type", existingLog.fuel_type || "");
      setValue("fuel_station", existingLog.fuel_station || "");
      setValue("is_full_tank", existingLog.is_full_tank);
      setValue("notes", existingLog.notes || "");
    } else if (initialVehicleId) {
      setValue("vehicle_id", initialVehicleId);
      const vehicle = vehicles.find((v) => v.id === initialVehicleId);
      if (vehicle) {
        if (vehicle.fuel_type) setValue("fuel_type", vehicle.fuel_type);
        if (vehicle.current_odometer) setValue("odometer", vehicle.current_odometer);
      }
    }
  }, [existingLog, initialVehicleId, vehicles, setValue, todayStr]);

  // Watch for auto calculation & mileage notice
  const watchedLiters = useWatch({ control, name: "liters" });
  const watchedPrice = useWatch({ control, name: "price_per_liter" });
  const watchedVehicleId = useWatch({ control, name: "vehicle_id" });
  const watchedOdometer = useWatch({ control, name: "odometer" });

  const litersNum = Number(watchedLiters) || 0;
  const priceNum = Number(watchedPrice) || 0;
  const computedTotalCost = litersNum * priceNum;

  // Selected vehicle check for odometer notice
  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);
  const currentVehicleOdometer = selectedVehicle?.current_odometer ?? 0;
  const isOdometerAdvancing =
    watchedOdometer !== undefined &&
    watchedOdometer !== null &&
    Number(watchedOdometer) > currentVehicleOdometer &&
    currentVehicleOdometer > 0;

  async function onSubmit(data: FuelLogFormValues) {
    setServerError(null);

    const liters = Number(data.liters);
    const pricePerLiter = Number(data.price_per_liter);
    const totalCost = liters * pricePerLiter;

    try {
      if (isEditing && logId) {
        const payload: FuelLogUpdate = {
          vehicle_id: data.vehicle_id,
          log_date: data.log_date,
          odometer: Number(data.odometer),
          liters,
          price_per_liter: pricePerLiter,
          total_cost: totalCost,
          fuel_type: data.fuel_type || null,
          fuel_station: data.fuel_station || null,
          is_full_tank: data.is_full_tank,
          notes: data.notes || null,
        };
        await updateMutation.mutateAsync({ id: logId, payload });
      } else {
        const payload: FuelLogInsert = {
          vehicle_id: data.vehicle_id,
          log_date: data.log_date,
          odometer: Number(data.odometer),
          liters,
          price_per_liter: pricePerLiter,
          total_cost: totalCost,
          fuel_type: data.fuel_type || null,
          fuel_station: data.fuel_station || null,
          is_full_tank: data.is_full_tank,
          notes: data.notes || null,
        };
        await createMutation.mutateAsync(payload);
      }

      router.push("/fuel-logs");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to save fuel log.");
    }
  }

  if (vehiclesLoading || (isEditing && logLoading)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/fuel-logs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to fuel logs
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Fuel className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit Fuel Log" : "Add Fuel Log"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update your refuelling details below."
                : "Record a new refuelling event for your vehicle."}
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

          {/* Date & Odometer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" error={errors.log_date?.message}>
              <input
                {...register("log_date")}
                type="date"
                max={todayStr}
                className={inputClass(!!errors.log_date)}
              />
            </Field>

            <Field label="Current Odometer (km)" error={errors.odometer?.message}>
              <input
                {...register("odometer")}
                type="number"
                min={0}
                placeholder={currentVehicleOdometer ? `Current: ${currentVehicleOdometer}` : "e.g. 45000"}
                className={inputClass(!!errors.odometer)}
              />
            </Field>
          </div>

          {/* Informational Notice for Odometer Advancement */}
          {isOdometerAdvancing && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Odometer Notice:</span> Entered odometer ({Number(watchedOdometer).toLocaleString()} km) is greater than vehicle's current odometer ({currentVehicleOdometer.toLocaleString()} km). The vehicle's mileage will automatically update on save.
              </div>
            </div>
          )}

          {/* Liters & Price Per Liter */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Liters" error={errors.liters?.message}>
              <input
                {...register("liters")}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 45.5"
                className={inputClass(!!errors.liters)}
              />
            </Field>

            <Field label="Price Per Liter ($)" error={errors.price_per_liter?.message}>
              <input
                {...register("price_per_liter")}
                type="number"
                step="0.001"
                min="0.001"
                placeholder="e.g. 1.75"
                className={inputClass(!!errors.price_per_liter)}
              />
            </Field>
          </div>

          {/* Auto-calculated Total Cost Display */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Cost (Auto-calculated)</p>
                <p className="text-2xs text-muted-foreground">Liters × Price Per Liter</p>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                ${computedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Fuel Type & Fuel Station */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fuel Type" optional error={errors.fuel_type?.message}>
              <select
                {...register("fuel_type")}
                className={`${inputClass(!!errors.fuel_type)} appearance-none`}
              >
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fuel Station" optional error={errors.fuel_station?.message}>
              <input
                {...register("fuel_station")}
                placeholder="e.g. Shell, BP, Chevron"
                className={inputClass(!!errors.fuel_station)}
              />
            </Field>
          </div>

          {/* Full Tank Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              {...register("is_full_tank")}
              type="checkbox"
              id="is_full_tank"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <label htmlFor="is_full_tank" className="text-sm font-medium text-foreground cursor-pointer select-none">
              Full Tank (filled completely)
            </label>
          </div>

          {/* Notes */}
          <Field label="Notes" optional error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Any additional notes or observations..."
              className={inputClass(!!errors.notes)}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/fuel-logs"
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
                "Update Fuel Log"
              ) : (
                "Save Fuel Log"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
