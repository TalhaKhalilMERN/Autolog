"use client";

import * as React from "react";
import Link from "next/link";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import { ArrowLeft, Car, Gauge, Fuel, Settings2, Hash, Calendar, Layers } from "lucide-react";
import { DeleteVehicleButton } from "@/components/DeleteVehicleButton";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: vehicle, isLoading, error } = useVehicle(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back skeleton */}
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />

        {/* Hero Card skeleton */}
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />

        {/* Specs Grid skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Danger zone skeleton */}
        <div className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicles
        </Link>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error?.message || "Vehicle not found"}
        </div>
      </div>
    );
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const specs: { icon: React.ElementType; label: string; value: string | number | null }[] = [
    { icon: Calendar, label: "Year", value: vehicle.year },
    { icon: Car, label: "Make", value: vehicle.make },
    { icon: Layers, label: "Model", value: vehicle.model },
    { icon: Settings2, label: "Variant", value: vehicle.variant },
    { icon: Settings2, label: "Engine", value: vehicle.engine },
    { icon: Settings2, label: "Transmission", value: vehicle.transmission },
    { icon: Fuel, label: "Fuel Type", value: vehicle.fuel_type },
    { icon: Hash, label: "Registration", value: vehicle.registration_number },
    {
      icon: Gauge,
      label: "Current Odometer",
      value:
        vehicle.current_odometer != null
          ? `${Number(vehicle.current_odometer).toLocaleString()} km`
          : null,
    },
  ].filter((s) => s.value != null && s.value !== "");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vehicles
      </Link>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                {vehicleName}
              </h2>
              {vehicle.variant && (
                <p className="mt-0.5 text-sm text-muted-foreground">{vehicle.variant}</p>
              )}
              {vehicle.registration_number && (
                <p className="mt-1 font-mono text-sm font-medium uppercase tracking-widest text-foreground/70">
                  {vehicle.registration_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicle.fuel_type && (
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {vehicle.fuel_type}
              </span>
            )}
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Specs Grid */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-5 text-base font-semibold text-foreground">Specifications</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-4"
            >
              <div className="mt-0.5 rounded-lg bg-muted p-1.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{String(value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-1 text-base font-semibold text-foreground">Danger Zone</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Permanently delete this vehicle and all its associated data.
        </p>
        <DeleteVehicleButton vehicleId={id} vehicleName={vehicleName} />
      </div>
    </div>
  );
}
