"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Car,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Gauge,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { usePaginatedVehicles } from "@/features/vehicles/hooks/vehicles";
import VehiclesLoading from "./loading";

const FUEL_TYPES = [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid",
  "Plugin Hybrid",
  "CNG",
  "LPG",
];

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export default function VehiclesPage() {
  // Query parameters state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFuelType, setSelectedFuelType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name" | "odometer">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Debounce search input (300ms) for efficient server queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated vehicles from server API
  const { data, isLoading, isFetching, error } = usePaginatedVehicles({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    fuelType: selectedFuelType,
    sort: sortOrder,
  });

  const vehicles = data?.vehicles ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalCount === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(validCurrentPage * pageSize, totalCount);

  // Filter change handlers
  const handleFuelTypeChange = (val: string) => {
    setSelectedFuelType(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val: "newest" | "oldest" | "name" | "odometer") => {
    setSortOrder(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedFuelType("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm.trim() !== "" || selectedFuelType !== "all" || sortOrder !== "newest";

  if (isLoading && !data) {
    return <VehiclesLoading />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Failed to load vehicles: {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            My Vehicles
            {isFetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" title="Syncing..." />
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount === 0
              ? hasActiveFilters
                ? "No matching vehicles found"
                : "No vehicles added yet"
              : `${totalCount} vehicle${totalCount !== 1 ? "s" : ""} in your fleet`}
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add vehicle
        </Link>
      </div>

      {/* Search, Filter & Page Size Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search make, model, reg #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDebouncedSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Fuel Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={selectedFuelType}
            onChange={(e) => handleFuelTypeChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Fuel Types</option>
            {FUEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="odometer">Highest Mileage</option>
          </select>
        </div>

        {/* Page Size Selector */}
        <div className="relative flex items-center gap-2">
          <Layers className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State (0 total user vehicles) */}
      {totalCount === 0 && !hasActiveFilters && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No vehicles yet</h3>
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

      {/* No Search Matches */}
      {totalCount === 0 && hasActiveFilters && (
        <div className="rounded-xl border border-border/80 bg-card p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No matching vehicles</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No vehicles match your current search or filter criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Clear search & filters
          </button>
        </div>
      )}

      {/* Vehicles Grid */}
      {vehicles.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Link
                key={v.id}
                href={`/vehicles/${v.id}`}
                className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-elevated transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
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

                {/* Vehicle name & variant */}
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
                  {v.current_odometer !== null && v.current_odometer !== undefined ? (
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                      {v.current_odometer.toLocaleString()} km
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View details →
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex}</span> to{" "}
              <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
              <span className="font-semibold text-foreground">{totalCount}</span> vehicles
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pageNum === validCurrentPage
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "border border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
