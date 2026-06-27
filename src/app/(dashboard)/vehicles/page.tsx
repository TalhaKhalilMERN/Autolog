import { createClient } from "@/lib/supabase/server";
import { listVehicles } from "@/lib/services/vehicles";
import Link from "next/link";
import { Plus, Car } from "lucide-react";
import type { Vehicle } from "@/lib/types";

export default async function VehiclesPage() {
  const supabase = await createClient();

  // ── Data via service layer ──────────────────────────────────────────────
  const result = await listVehicles(supabase);

  if (result.error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Failed to load vehicles: {result.error}
      </div>
    );
  }

  const vehicles: Vehicle[] = result.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Vehicles</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {vehicles.length === 0
              ? "No vehicles added yet"
              : `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""} in your fleet`}
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
        >
          <Plus className="h-4 w-4" />
          Add vehicle
        </Link>
      </div>

      {/* Empty State */}
      {vehicles.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No vehicles yet
          </h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Add your first vehicle to start tracking maintenance, expenses, and more.
          </p>
          <Link
            href="/vehicles/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Add your first vehicle
          </Link>
        </div>
      )}

      {/* Vehicles Grid */}
      {vehicles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-elevated transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                {v.fuel_type && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {v.fuel_type}
                  </span>
                )}
              </div>

              {/* Vehicle name */}
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {v.year} {v.make} {v.model}
                </p>
                {v.variant && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{v.variant}</p>
                )}
              </div>

              {/* Footer meta */}
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                {v.registration_number ? (
                  <span className="font-mono font-medium uppercase tracking-wide text-foreground/80">
                    {v.registration_number}
                  </span>
                ) : (
                  <span>No registration</span>
                )}
                <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
