"use client";

import * as React from "react";
import Link from "next/link";
import { useVehicle } from "@/features/vehicles/hooks/vehicles";
import { useServiceRecords } from "@/features/vehicles/hooks/use-service-records";
import { useExpenses } from "@/features/vehicles/hooks/use-expenses";
import {
  ArrowLeft,
  Car,
  Gauge,
  Fuel,
  Settings2,
  Hash,
  Calendar,
  Layers,
  Plus,
  Wrench,
  Pencil,
  DollarSign,
  ExternalLink,
  Bell,
} from "lucide-react";
import { DeleteVehicleButton } from "@/components/DeleteVehicleButton";
import { DeleteServiceRecordButton } from "@/components/DeleteServiceRecordButton";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { DeleteReminderButton } from "@/components/DeleteReminderButton";
import { useReminders } from "@/features/vehicles/hooks/use-reminders";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useVehicle(id);
  const { data: serviceRecords, isLoading: serviceLoading, error: serviceError } = useServiceRecords(id);
  const { data: expenses, isLoading: expensesLoading, error: expensesError } = useExpenses(id);
  const { data: reminders, isLoading: remindersLoading, error: remindersError } = useReminders(id);

  const isLoading = vehicleLoading || serviceLoading || expensesLoading || remindersLoading;
  const error = vehicleError || serviceError || expensesError || remindersError;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back skeleton */}
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />

        {/* Hero Card skeleton */}
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />

        {/* Specs Grid skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Service History skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Expenses skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Reminders skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>

        {/* Danger zone skeleton */}
        <div className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vehicles
        </Link>
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error?.message || "Vehicle, service history, or expenses not found"}
        </div>
      </div>
    );
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

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
      icon: Gauge,
      label: "Current Odometer",
      value:
        vehicle.current_odometer != null
          ? `${Number(vehicle.current_odometer).toLocaleString()} km`
          : null,
    },
  ].filter((s) => s.value != null && s.value !== "");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vehicles
      </Link>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Car className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                {vehicleName}
              </h2>
              {vehicle.variant && (
                <p className="mt-0.5 text-sm text-muted-foreground">{vehicle.variant}</p>
              )}
              {vehicle.registration_number && (
                <p className="mt-1 font-mono text-sm font-medium uppercase tracking-widest text-foreground/70">
                  {vehicle.registration_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicle.fuel_type && (
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {vehicle.fuel_type}
              </span>
            )}
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Specs Grid */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-5 text-base font-semibold text-foreground">Specifications</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 p-4"
            >
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

      {/* Service History Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Service History</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {serviceRecords && serviceRecords.length > 0
                ? `${serviceRecords.length} record${serviceRecords.length !== 1 ? "s" : ""} logged`
                : "No services logged yet"}
            </p>
          </div>
          <Link
            href={`/vehicles/${id}/service-records/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Service Record
          </Link>
        </div>

        {/* Service Records list */}
        {(!serviceRecords || serviceRecords.length === 0) ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
            <Wrench className="h-8 w-8 text-primary opacity-60 mb-3" />
            <p className="text-sm font-medium text-foreground">No service records</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Keep track of engine tune-ups, oil changes, tire rotations, and general maintenance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {serviceRecords.map((record) => (
              <div
                key={record.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-all hover:border-primary/20 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {record.service_type}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(record.service_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(record.cost).toFixed(2)}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {record.mileage.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {record.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                    {record.notes}
                  </p>
                )}

                {/* Reminders section */}
                {(record.next_service_date || record.next_service_mileage) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border/40 pt-3 text-2xs font-medium text-muted-foreground">
                    <span className="text-primary/95 font-semibold">Next Service Reminder:</span>
                    {record.next_service_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.next_service_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                    {record.next_service_mileage && (
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {record.next_service_mileage.toLocaleString()} km
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                  <Link
                    href={`/vehicles/${id}/service-records/${record.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <DeleteServiceRecordButton recordId={record.id} serviceType={record.service_type} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Expenses</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {expenses && expenses.length > 0
                ? `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} logged`
                : "No expenses logged yet"}
            </p>
          </div>
          <Link
            href={`/vehicles/${id}/expenses/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </div>

        {/* Expenses list */}
        {(!expenses || expenses.length === 0) ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
            <DollarSign className="h-8 w-8 text-primary opacity-60 mb-3" />
            <p className="text-sm font-medium text-foreground">No expenses</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Track fuel, insurance, parking, registrations, accessories, tune-ups, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-all hover:border-primary/20 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          {expense.title}
                        </h4>
                        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {expense.category}
                        </span>
                        {/* Ownership badge for service-generated expenses */}
                        {expense.service_record_id && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-3xs font-medium text-primary/80">
                            <Wrench className="h-2.5 w-2.5" />
                            Managed by Service History
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(expense.expense_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(expense.amount).toFixed(2)}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {expense.mileage.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {expense.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                    {expense.notes}
                  </p>
                )}

                {/* Actions — branch on ownership */}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                  {expense.service_record_id ? (
                    // Service-owned expense: navigate to the owning service record
                    <Link
                      href={`/vehicles/${id}/service-records/${expense.service_record_id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/10 cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Edit Service Record
                    </Link>
                  ) : (
                    // Manual expense: show standard edit + delete controls
                    <>
                      <Link
                        href={`/vehicles/${id}/expenses/${expense.id}/edit`}
                        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <DeleteExpenseButton expenseId={expense.id} title={expense.title} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Maintenance Reminders</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {reminders && reminders.length > 0
                ? `${reminders.length} reminder${reminders.length !== 1 ? "s" : ""} set`
                : "No reminders set yet"}
            </p>
          </div>
          <Link
            href={`/vehicles/${id}/reminders/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Link>
        </div>

        {/* Reminders list */}
        {(!reminders || reminders.length === 0) ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
            <Bell className="h-8 w-8 text-primary opacity-60 mb-3" />
            <p className="text-sm font-medium text-foreground">No reminders</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Stay on top of vehicle maintenance. Add reminders for oil changes, registrations, or inspections.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="group relative flex flex-col gap-4 rounded-xl border border-border/60 bg-background/50 p-4 transition-all hover:border-primary/20 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          {reminder.title}
                        </h4>
                        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {reminder.reminder_type}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider border ${
                            reminder.status === "completed"
                              ? "bg-success/15 text-success border-success/30"
                              : reminder.status === "cancelled"
                              ? "bg-muted text-muted-foreground border-border/60"
                              : "bg-warning/15 text-warning border-warning/30"
                          }`}
                        >
                          {reminder.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-muted-foreground/75" />
                        <span>{vehicleName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right gap-1">
                    {reminder.due_date && (
                      <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Due {new Date(reminder.due_date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                    {reminder.due_odometer && (
                      <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                        Due {reminder.due_odometer.toLocaleString()} km
                      </span>
                    )}
                  </div>
                </div>

                {reminder.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                    {reminder.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                  <Link
                    href={`/vehicles/${id}/reminders/${reminder.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <DeleteReminderButton reminderId={reminder.id} title={reminder.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="mb-1 text-base font-semibold text-foreground">Danger Zone</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Permanently delete this vehicle and all its associated data.
        </p>
        <DeleteVehicleButton vehicleId={id} vehicleName={vehicleName} />
      </div>
    </div>
  );
}
