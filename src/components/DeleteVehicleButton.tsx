"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

import { useDeleteVehicle } from "@/features/vehicles/hooks/vehicles";

/**
 * DeleteVehicleButton
 *
 * Client component that calls DELETE /api/vehicles/[id] and redirects
 * back to the vehicles list on success.
 * Uses an inline confirm step instead of a browser dialog.
 */
export function DeleteVehicleButton({
  vehicleId,
  vehicleName,
}: {
  vehicleId: string;
  vehicleName: string;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteVehicle();

  const isPending = deleteMutation.isPending;

  async function handleDelete() {
    setError(null);

    try {
      await deleteMutation.mutateAsync(vehicleId);
      router.push("/vehicles");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete vehicle.");
    }
  }

  if (showConfirm) {
    return (
      <div className="space-y-3">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
          <p className="flex-1 text-sm text-foreground">
            Delete <span className="font-medium">{vehicleName}</span>? This cannot be undone.
          </p>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Confirm delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/10 cursor-pointer"
    >
      <Trash2 className="h-4 w-4" />
      Delete vehicle
    </button>
  );
}
