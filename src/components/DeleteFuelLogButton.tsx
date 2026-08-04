"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useDeleteFuelLog } from "@/features/vehicles/hooks/use-fuel-logs";

export function DeleteFuelLogButton({
  logId,
  liters,
  onDeleted,
}: {
  logId: string;
  liters: number;
  onDeleted?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteMutation = useDeleteFuelLog();

  const isPending = deleteMutation.isPending;

  async function handleDelete() {
    setError(null);

    try {
      await deleteMutation.mutateAsync(logId);
      setShowConfirm(false);
      if (onDeleted) onDeleted();
    } catch (err: any) {
      setError(err.message || "Failed to delete fuel log.");
    }
  }

  if (showConfirm) {
    return (
      <div className="mt-2 space-y-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <p className="flex-1 text-xs text-foreground">
            Delete <span className="font-semibold">{liters}L</span> fuel log?
          </p>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded bg-background border border-border px-2 py-1 text-2xs font-medium text-muted-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-1 rounded bg-destructive px-2 py-1 text-2xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1 rounded border border-destructive/20 px-2 py-1 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 cursor-pointer"
      title="Delete fuel log"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}
