"use client";

import * as React from "react";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import { EditVehicleForm } from "./EditVehicleForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: vehicle, isLoading, error } = useVehicle(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
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

  return <EditVehicleForm vehicle={vehicle} />;
}
