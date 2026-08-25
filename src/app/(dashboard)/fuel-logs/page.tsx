"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Fuel,
  Search,
  Filter,
  Calendar,
  Gauge,
  Building2,
  CheckCircle2,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { usePaginatedFuelLogs } from "@/features/vehicles/hooks/use-fuel-logs";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { DeleteFuelLogButton } from "@/components/DeleteFuelLogButton";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { Pagination } from "@/components/ui/Pagination";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

function FuelLogsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-60" />
          </div>
        ))}
      </div>
    </div>
  );
}

const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "Plugin Hybrid", "CNG", "LPG"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function FuelLogsPage() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "all";

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  // View Mode state (Default: List)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);
  const [selectedFuelType, setSelectedFuelType] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading: logsLoading, isFetching, error: logsError } = usePaginatedFuelLogs({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    vehicleId: selectedVehicleId,
    fuelType: selectedFuelType,
  });

  const fuelLogs = data?.fuelLogs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const vehicleMap = useMemo(() => {
    return Object.fromEntries(vehicles.map((v) => [v.id, v]));
  }, [vehicles]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedVehicleId !== "all" ||
    selectedFuelType !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedVehicleId("all");
    setSelectedFuelType("all");
    setCurrentPage(1);
  };

  const handleFilterChange = (fn: () => void) => {
    fn();
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const isLoading = (logsLoading && !data) || vehiclesLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <FuelLogsSkeleton />
      </div>
    );
  }

  if (logsError) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Failed to load fuel logs: {logsError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Fuel Logs
            {isFetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" title="Loading..." />
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount === 0
              ? hasActiveFilters
                ? "No matching fuel logs"
                : "No refuelling events logged yet"
              : `${totalCount} fuel log${totalCount !== 1 ? "s" : ""} recorded`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          <Link
            href="/fuel-logs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Fuel Log
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid gap-3 sm:grid-cols-3 flex-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search station, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Vehicle Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={selectedVehicleId}
              onChange={(e) => handleFilterChange(() => setSelectedVehicleId(e.target.value))}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div className="relative">
            <Fuel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={selectedFuelType}
              onChange={(e) => handleFilterChange(() => setSelectedFuelType(e.target.value))}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">All Fuel Types</option>
              {FUEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 && !hasActiveFilters ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Fuel className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No fuel logs yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Track your refuelling details, liters, fuel prices, and fuel stations.
          </p>
          <Link
            href="/fuel-logs/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Add your first fuel log
          </Link>
        </div>
      ) : totalCount === 0 && hasActiveFilters ? (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching fuel logs found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search terms or filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* Fuel Logs List & Grid Views */
        <div className="space-y-6">
          {viewMode === "list" ? (
            /* LIST VIEW LAYOUT */
            <div className="space-y-3">
              {fuelLogs.map((log) => {
                const vehicle = vehicleMap[log.vehicle_id];
                const vehicleName = vehicle
                  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                  : "Unknown Vehicle";

                return (
                  <div
                    key={log.id}
                    className="group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left info: Vehicle + Date + Station */}
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Fuel className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-foreground">
                              {vehicleName}
                            </h4>
                            {log.is_full_tank ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Full Tank
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/50 px-2.5 py-0.5 text-3xs font-medium text-muted-foreground">
                                Partial Fill
                              </span>
                            )}
                            {log.fuel_type && (
                              <span className="rounded-full bg-muted px-2.5 py-0.5 text-3xs font-medium text-muted-foreground">
                                {log.fuel_type}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {new Date(log.log_date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "UTC",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3.5 w-3.5 text-muted-foreground/75" />
                              {Number(log.odometer).toLocaleString()} km
                            </span>
                            {log.fuel_station && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground/75" />
                                {log.fuel_station}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right info: Price + Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground tabular-nums">
                            ${Number(log.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-3xs text-muted-foreground">
                            {Number(log.liters).toFixed(2)} L @ ${Number(log.price_per_liter).toFixed(2)}/L
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {log.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                        {log.notes}
                      </p>
                    )}

                    {/* Footer / Actions */}
                    <div className="flex items-center justify-end border-t border-border/40 pt-2 gap-2 text-xs">
                      <Link
                        href={`/fuel-logs/${log.id}/edit`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <DeleteFuelLogButton logId={log.id} liters={Number(log.liters)} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW LAYOUT */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fuelLogs.map((log) => {
                const vehicle = vehicleMap[log.vehicle_id];
                const vehicleName = vehicle
                  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                  : "Unknown Vehicle";

                return (
                  <div
                    key={log.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Fuel className="h-5 w-5" />
                        </div>
                        {log.is_full_tank ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Full Tank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/50 px-2 py-0.5 text-3xs font-medium text-muted-foreground">
                            Partial
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {vehicleName}
                        </h4>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.log_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                        <div>
                          <p className="text-3xs text-muted-foreground">Odometer</p>
                          <p className="font-semibold text-foreground tabular-nums">
                            {Number(log.odometer).toLocaleString()} km
                          </p>
                        </div>
                        <div>
                          <p className="text-3xs text-muted-foreground">Volume</p>
                          <p className="font-semibold text-foreground tabular-nums">
                            {Number(log.liters).toFixed(2)} L
                          </p>
                        </div>
                      </div>

                      {log.fuel_station && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {log.fuel_station}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <div>
                        <p className="text-xs font-bold text-foreground tabular-nums">
                          ${Number(log.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-3xs text-muted-foreground">
                          ${Number(log.price_per_liter).toFixed(2)} / L
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/fuel-logs/${log.id}/edit`}
                          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <DeleteFuelLogButton logId={log.id} liters={Number(log.liters)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            itemName="fuel logs"
          />
        </div>
      )}
    </div>
  );
}
