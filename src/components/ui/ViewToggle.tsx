"use client";

import { LayoutList, LayoutGrid } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewChange, className = "" }: ViewToggleProps) {
  return (
    <div className={`inline-flex items-center rounded-lg border border-border bg-background p-1 gap-1 h-9.5 ${className}`}>
      <button
        type="button"
        onClick={() => onViewChange("list")}
        title="List View"
        aria-label="List View"
        className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
          viewMode === "list"
            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <LayoutList className="h-4 w-4 mr-1.5" />
        List
      </button>
      <button
        type="button"
        onClick={() => onViewChange("grid")}
        title="Grid View"
        aria-label="Grid View"
        className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
          viewMode === "grid"
            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        Grid
      </button>
    </div>
  );
}
