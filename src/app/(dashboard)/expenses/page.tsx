"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DollarSign, Search, Filter, Calendar, Gauge, Pencil, Car, ExternalLink, Wrench, Plus, RotateCcw, X,
} from "lucide-react";
import { usePaginatedExpenses } from "@/features/vehicles/hooks/use-expenses";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { Pagination } from "@/components/ui/Pagination";

const CATEGORIES = ["Fuel","Insurance","Registration","Parking","Car Wash","Accessories","Tax","Fine","Service","Other"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted/60" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_,i) => <div key={i} className="h-10 rounded bg-muted/60" />)}
      </div>
      {[...Array(4)].map((_,i) => <div key={i} className="h-28 rounded-xl border border-border bg-card" />)}
    </div>
  );
}

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "all";

  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  // View Mode state (Default: List)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc"|"asc">("desc");

  // Pagination states
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

  const { data, isLoading: expensesLoading, isFetching, error } = usePaginatedExpenses({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    vehicleId: selectedVehicleId,
    category: selectedCategory,
    sort: sortOrder,
  });

  const expenses = data?.expenses ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalAmount = data?.totalAmount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedVehicleId !== "all" ||
    selectedCategory !== "all" ||
    sortOrder !== "desc";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedVehicleId("all");
    setSelectedCategory("all");
    setSortOrder("desc");
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

  const addHref = selectedVehicleId !== "all"
    ? `/expenses/new?vehicleId=${selectedVehicleId}`
    : "/expenses/new";

  if ((expensesLoading && !data) || vehiclesLoading) return <div className="mx-auto max-w-5xl"><PageSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">Failed to load expenses: {error.message}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Expenses
            {isFetching && (
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" title="Loading..." />
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount === 0
              ? hasActiveFilters
                ? "No matching expenses"
                : "No expenses logged yet"
              : `${totalCount} expense${totalCount !== 1 ? "s" : ""} recorded`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-right">
              <p className="text-3xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground tabular-nums">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          <Link
            href={addHref}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, notes..."
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
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange(() => setSelectedCategory(e.target.value))}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => handleFilterChange(() => setSortOrder(e.target.value as "desc"|"asc"))}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
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

      {/* Content area */}
      {totalCount === 0 && !hasActiveFilters ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No expenses yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">Log fuel, insurance, parking, and more.</p>
          <Link href="/expenses/new" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px">
            <Plus className="h-4 w-4" />Add First Expense
          </Link>
        </div>
      ) : totalCount === 0 && hasActiveFilters ? (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching expenses</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "list" ? (
            /* LIST VIEW */
            <div className="space-y-3">
              {expenses.map((expense) => {
                const v = vehicleMap[expense.vehicle_id];
                const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
                return (
                  <div key={expense.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">{expense.title}</h4>
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {expense.category}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Car className="h-3.5 w-3.5 text-primary" />
                              {vehicleName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(expense.expense_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3.5 w-3.5" />
                              {Number(expense.mileage).toLocaleString()} km
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-foreground tabular-nums">
                          ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {expense.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                        {expense.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                      <div>
                        {expense.service_record_id && (
                          <Link href={`/services`} className="inline-flex items-center gap-1 text-sky-500 hover:underline">
                            <Wrench className="h-3 w-3" />
                            Linked Service
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/expenses/${expense.id}/edit`} className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 font-medium text-foreground hover:bg-accent transition-all cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" />Edit
                        </Link>
                        <DeleteExpenseButton expenseId={expense.id} title={expense.title} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expenses.map((expense) => {
                const v = vehicleMap[expense.vehicle_id];
                const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
                return (
                  <div key={expense.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {expense.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-foreground">{expense.title}</h4>
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground/80">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          {vehicleName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(expense.expense_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          {Number(expense.mileage).toLocaleString()} km
                        </span>
                      </div>

                      {expense.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 border border-border/40 leading-relaxed line-clamp-2">
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-base font-bold text-foreground tabular-nums">
                        ${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link href={`/expenses/${expense.id}/edit`} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer">
                          <Pencil className="h-3.5 w-3.5" />Edit
                        </Link>
                        <DeleteExpenseButton expenseId={expense.id} title={expense.title} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            itemName="expenses"
          />
        </div>
      )}
    </div>
  );
}
