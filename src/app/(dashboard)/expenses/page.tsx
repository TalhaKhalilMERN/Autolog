"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DollarSign, Search, Filter, Calendar, Gauge, Pencil, Car, ExternalLink, Wrench, Plus,
} from "lucide-react";
import { useExpenses } from "@/features/vehicles/hooks/use-expenses";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

const CATEGORIES = ["Fuel","Insurance","Registration","Parking","Car Wash","Accessories","Tax","Fine","Service","Other"];

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

  const { data: expenses = [], isLoading: expensesLoading, error } = useExpenses();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc"|"asc">("desc");

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const filtered = useMemo(() => expenses
    .filter((e) => {
      if (selectedVehicleId !== "all" && e.vehicle_id !== selectedVehicleId) return false;
      if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const v = vehicleMap[e.vehicle_id];
        const vs = v ? `${v.make} ${v.model}`.toLowerCase() : "";
        if (!e.title.toLowerCase().includes(t) && !e.category.toLowerCase().includes(t) && !vs.includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const d = new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      return sortOrder === "desc" ? -d : d;
    }),
  [expenses, selectedVehicleId, selectedCategory, searchTerm, sortOrder, vehicleMap]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const addHref = selectedVehicleId !== "all"
    ? `/expenses/new?vehicleId=${selectedVehicleId}`
    : "/expenses/new";

  if (expensesLoading || vehiclesLoading) return <div className="mx-auto max-w-5xl"><PageSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">Failed to load expenses: {error.message}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Expenses</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {expenses.length === 0 ? "No expenses logged yet" : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} across all vehicles`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-right">
              <p className="text-3xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground tabular-nums">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          )}
          <Link
            href={addHref}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search title, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30">
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30">
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "desc"|"asc")}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching expenses</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
          <button onClick={() => { setSearchTerm(""); setSelectedVehicleId("all"); setSelectedCategory("all"); }}
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((expense) => {
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
                        <span className="rounded bg-muted px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">{expense.category}</span>
                        {expense.service_record_id && (
                          <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-3xs font-medium text-primary/80">
                            <Wrench className="h-2.5 w-2.5" />Managed by Service
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground/80"><Car className="h-3.5 w-3.5 text-primary" />{vehicleName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(expense.expense_date).toLocaleDateString(undefined, { year:"numeric",month:"short",day:"numeric",timeZone:"UTC" })}</span>
                        <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{expense.mileage.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-foreground tabular-nums">${Number(expense.amount).toFixed(2)}</span>
                </div>
                {expense.notes && <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">{expense.notes}</p>}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-2">
                  {expense.service_record_id ? (
                    <Link href={`/services/${expense.service_record_id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/10 cursor-pointer">
                      <ExternalLink className="h-3.5 w-3.5" />Edit Service Record
                    </Link>
                  ) : (
                    <>
                      <Link href={`/expenses/${expense.id}/edit`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer">
                        <Pencil className="h-3.5 w-3.5" />Edit
                      </Link>
                      <DeleteExpenseButton expenseId={expense.id} title={expense.title} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
