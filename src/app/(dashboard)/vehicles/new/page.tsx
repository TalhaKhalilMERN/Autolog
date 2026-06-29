"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCreateVehicle } from "@/features/vehicles/hooks/vehicles";
import type { VehicleInsert } from "@/lib/types";

/* ─── Schema ─── */
const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(currentYear + 1, `Year must be ${currentYear + 1} or earlier`),
  variant: z.string().max(80).optional(),
  engine: z.string().max(80).optional(),
  transmission: z.string().max(80).optional(),
  fuel_type: z.string().max(50).optional(),
  registration_number: z.string().max(20).optional(),
  current_odometer: z.coerce
    .number()
    .int()
    .min(0, "Odometer cannot be negative")
    .optional(),
});

/**
 * Explicit form type — avoids z.coerce.number() inferring `unknown` and
 * causing a Resolver type mismatch with react-hook-form.
 */
type VehicleFormValues = {
  make: string;
  model: string;
  year: number;
  variant?: string;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  registration_number?: string;
  current_odometer?: number;
};

/* ─── Helpers ─── */
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Semi-automatic", "Dual-clutch"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "Plugin Hybrid", "CNG", "LPG"];

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

/* ─── Page ─── */
export default function NewVehiclePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const createVehicleMutation = useCreateVehicle();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
    defaultValues: { year: currentYear },
  });

  const isSubmitting = createVehicleMutation.isPending;

  async function onSubmit(data: VehicleFormValues) {
    setServerError(null);

    try {
      const payload: VehicleInsert = {
        make: data.make,
        model: data.model,
        year: Number(data.year),
        variant: data.variant || null,
        engine: data.engine || null,
        transmission: data.transmission || null,
        fuel_type: data.fuel_type || null,
        registration_number: data.registration_number || null,
        current_odometer:
          data.current_odometer !== undefined && !Number.isNaN(data.current_odometer)
            ? Number(data.current_odometer)
            : null,
      };

      await createVehicleMutation.mutateAsync(payload);
      router.push("/vehicles");
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "Failed to create vehicle.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vehicles
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Add a Vehicle</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below to add a vehicle to your fleet.
        </p>

        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
          {/* Make / Model / Year */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Make" error={errors.make?.message}>
              <input
                {...register("make")}
                placeholder="e.g. Toyota"
                className={inputClass(!!errors.make)}
              />
            </Field>
            <Field label="Model" error={errors.model?.message}>
              <input
                {...register("model")}
                placeholder="e.g. Corolla"
                className={inputClass(!!errors.model)}
              />
            </Field>
            <Field label="Year" error={errors.year?.message}>
              <input
                {...register("year")}
                type="number"
                min={1900}
                max={currentYear + 1}
                placeholder={String(currentYear)}
                className={inputClass(!!errors.year)}
              />
            </Field>
          </div>

          {/* Variant */}
          <Field label="Variant" optional error={errors.variant?.message}>
            <input
              {...register("variant")}
              placeholder="e.g. SE, XSE, Sport"
              className={inputClass(!!errors.variant)}
            />
          </Field>

          {/* Engine / Transmission */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Engine" optional error={errors.engine?.message}>
              <input
                {...register("engine")}
                placeholder="e.g. 2.0L 4-cyl"
                className={inputClass(!!errors.engine)}
              />
            </Field>
            <Field label="Transmission" optional error={errors.transmission?.message}>
              <select
                {...register("transmission")}
                className={`${inputClass(!!errors.transmission)} appearance-none`}
              >
                <option value="">Select transmission</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Fuel Type / Registration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fuel Type" optional error={errors.fuel_type?.message}>
              <select
                {...register("fuel_type")}
                className={`${inputClass(!!errors.fuel_type)} appearance-none`}
              >
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Registration Number" optional error={errors.registration_number?.message}>
              <input
                {...register("registration_number")}
                placeholder="e.g. ABC-1234"
                className={inputClass(!!errors.registration_number)}
              />
            </Field>
          </div>

          {/* Odometer */}
          <Field label="Current Odometer (km)" optional error={errors.current_odometer?.message}>
            <input
              {...register("current_odometer")}
              type="number"
              min={0}
              placeholder="e.g. 45000"
              className={inputClass(!!errors.current_odometer)}
            />
          </Field>

          <hr className="border-border/60" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/vehicles"
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
                "Save Vehicle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
