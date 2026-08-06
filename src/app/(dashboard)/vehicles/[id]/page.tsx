"use client";

import * as React from "react";
import Link from "next/link";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import { useServiceRecords } from "@/features/vehicles/hooks/use-service-records";
import { useExpenses } from "@/features/vehicles/hooks/use-expenses";
import { useReminders } from "@/features/vehicles/hooks/use-reminders";
import { useFuelLogs } from "@/features/vehicles/hooks/use-fuel-logs";
import {
  ArrowLeft, Car, Gauge, Fuel, Settings2, Hash, Calendar, Layers,
  Wrench, DollarSign, Bell, ArrowRight, TrendingUp, BarChart3,
} from "lucide-react";
import { DeleteVehicleButton } from "@/components/DeleteVehicleButton";

/* ─── Read-Focused Section Header ─── */
function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  total,
}: {
  title: string;
  subtitle: string;
  viewAllHref: string;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Link
        href={viewAllHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:text-primary cursor-pointer"
      >
        View All {total > 0 ? `(${total})` : ""}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useVehicle(id);
  const { data: serviceRecords = [], isLoading: serviceLoading } = useServiceRecords(id);
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(id);
  const { data: reminders = [], isLoading: remindersLoading } = useReminders(id);
  const { data: fuelLogs = [], isLoading: fuelLoading } = useFuelLogs(id);

  const isLoading = vehicleLoading || serviceLoading || expensesLoading || remindersLoading || fuelLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to vehicles
        </Link>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {vehicleError?.message || "Vehicle not found"}
        </div>
      </div>
    );
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Quick statistics calculations
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.total_cost), 0);
  const totalLiters = fuelLogs.reduce((sum, f) => sum + Number(f.liters), 0);
  const pendingRemindersCount = reminders.filter((r) => r.status === "pending").length;

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
      icon: Gauge, label: "Current Odometer",
      value: vehicle.current_odometer != null ? `${Number(vehicle.current_odometer).toLocaleString()} km` : null,
    },
  ].filter((s) => s.value != null && s.value !== "");

  // Previews (last 3 items)
  const recentServices = serviceRecords.slice(0, 3);
  const recentExpenses = expenses.slice(0, 3);
  const recentFuelLogs = fuelLogs.slice(0, 3);
  const upcomingReminders = [...reminders]
    .filter((r) => r.status === "pending")
    .sort((a, b) => {
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 3);

  const statusCls = (status: string) =>
    status === "completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
    : status === "cancelled" ? "bg-muted text-muted-foreground border-border/60"
    : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to vehicles
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{vehicleName}</h2>
              {vehicle.variant && <p className="mt-0.5 text-sm text-muted-foreground">{vehicle.variant}</p>}
              {vehicle.registration_number && (
                <p className="mt-1 font-mono text-sm font-medium uppercase tracking-widest text-foreground/70">
                  {vehicle.registration_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicle.fuel_type && (
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{vehicle.fuel_type}</span>
            )}
            <Link href={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer">
              <Settings2 className="h-3.5 w-3.5" />Edit Vehicle
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="h-4 w-4 text-sky-500" />
            <span>Services</span>
          </div>
          <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{serviceRecords.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span>Total Expenses</span>
          </div>
          <p className="mt-2 text-xl font-bold text-foreground tabular-nums">${totalExpensesAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Fuel className="h-4 w-4 text-primary" />
            <span>Fuel Refuels</span>
          </div>
          <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{fuelLogs.length} ({totalLiters.toFixed(0)} L)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Bell className="h-4 w-4 text-amber-500" />
            <span>Pending Alerts</span>
          </div>
          <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{pendingRemindersCount}</p>
        </div>
      </div>

      {/* Specifications */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-5 text-base font-semibold text-foreground">Specifications</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-4">
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

      {/* ── Recent Services Preview ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <SectionHeader
          title="Recent Services"
          subtitle={serviceRecords.length > 0 ? `Showing ${recentServices.length} of ${serviceRecords.length} service records` : "No services logged"}
          viewAllHref={`/services?vehicleId=${id}`}
          total={serviceRecords.length}
        />
        {recentServices.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <Wrench className="h-6 w-6 text-primary opacity-60 mb-1.5" />
            <p className="text-sm font-medium text-foreground">No service records preview</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentServices.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-500/10 p-2 text-sky-500"><Wrench className="h-4 w-4" /></div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{record.service_type}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.service_date).toLocaleDateString(undefined, { year:"numeric",month:"short",day:"numeric",timeZone:"UTC" })} · {record.mileage.toLocaleString()} km
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">${Number(record.cost).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Expenses Preview ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <SectionHeader
          title="Recent Expenses"
          subtitle={expenses.length > 0 ? `Showing ${recentExpenses.length} of ${expenses.length} expense logs` : "No expenses logged"}
          viewAllHref={`/expenses?vehicleId=${id}`}
          total={expenses.length}
        />
        {recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <DollarSign className="h-6 w-6 text-primary opacity-60 mb-1.5" />
            <p className="text-sm font-medium text-foreground">No expenses preview</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500"><DollarSign className="h-4 w-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{expense.title}</h4>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-3xs font-semibold uppercase text-muted-foreground">{expense.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleDateString(undefined, { year:"numeric",month:"short",day:"numeric",timeZone:"UTC" })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">${Number(expense.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Fuel Logs Preview ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <SectionHeader
          title="Recent Fuel Logs"
          subtitle={fuelLogs.length > 0 ? `Showing ${recentFuelLogs.length} of ${fuelLogs.length} fuel logs` : "No fuel logs recorded"}
          viewAllHref={`/fuel-logs?vehicleId=${id}`}
          total={fuelLogs.length}
        />
        {recentFuelLogs.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <Fuel className="h-6 w-6 text-primary opacity-60 mb-1.5" />
            <p className="text-sm font-medium text-foreground">No fuel logs preview</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentFuelLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Fuel className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.liters} L @ ${Number(log.price_per_liter).toFixed(2)}/L</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.log_date).toLocaleDateString(undefined, { year:"numeric",month:"short",day:"numeric",timeZone:"UTC" })} · {log.odometer.toLocaleString()} km
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">${Number(log.total_cost).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming Reminders Preview ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <SectionHeader
          title="Upcoming Reminders"
          subtitle={upcomingReminders.length > 0 ? `Showing ${upcomingReminders.length} pending reminder${upcomingReminders.length !== 1 ? "s" : ""}` : "No pending reminders"}
          viewAllHref={`/reminders?vehicleId=${id}`}
          total={reminders.length}
        />
        {upcomingReminders.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <Bell className="h-6 w-6 text-primary opacity-60 mb-1.5" />
            <p className="text-sm font-medium text-foreground">No upcoming reminders</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500"><Bell className="h-4 w-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{reminder.title}</h4>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-3xs font-semibold uppercase text-muted-foreground">{reminder.reminder_type}</span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-3xs font-semibold uppercase ${statusCls(reminder.status)}`}>{reminder.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reminder.due_date && `Due: ${new Date(reminder.due_date).toLocaleDateString(undefined, { year:"numeric",month:"short",day:"numeric",timeZone:"UTC" })}`}
                      {reminder.due_date && reminder.due_odometer && " · "}
                      {reminder.due_odometer && `Due: ${reminder.due_odometer.toLocaleString()} km`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-1 text-base font-semibold text-foreground">Danger Zone</h3>
        <p className="mb-4 text-sm text-muted-foreground">Permanently delete this vehicle and all its associated data.</p>
        <DeleteVehicleButton vehicleId={id} vehicleName={vehicleName} />
      </div>
    </div>
  );
}
