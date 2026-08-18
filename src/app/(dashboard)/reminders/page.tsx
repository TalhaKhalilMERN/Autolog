"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Search, Filter, Calendar, Gauge, Pencil, Car, Plus, ArrowUpDown } from "lucide-react";
import { useReminders } from "@/features/vehicles/hooks/use-reminders";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { DeleteReminderButton } from "@/components/DeleteReminderButton";

const STATUSES = ["pending", "completed", "cancelled"] as const;

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-8 w-48 rounded bg-muted/60" />
        <div className="h-10 w-36 rounded bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-muted/60" />)}
      </div>
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl border border-border bg-card" />)}
    </div>
  );
}

export default function RemindersPage() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "all";

  const { data: reminders = [], isLoading: remindersLoading, error } = useReminders();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState<"created_desc" | "created_asc" | "due_asc" | "due_desc">("created_desc");

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const filtered = useMemo(() => reminders
    .filter((r) => {
      if (selectedVehicleId !== "all" && r.vehicle_id !== selectedVehicleId) return false;
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const v = vehicleMap[r.vehicle_id];
        const vs = v ? `${v.make} ${v.model}`.toLowerCase() : "";
        if (!r.title.toLowerCase().includes(t) && !(r.description ?? "").toLowerCase().includes(t) && !vs.includes(t)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "created_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === "created_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOption === "due_asc") {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      }
      if (sortOption === "due_desc") {
        const da = a.due_date ? new Date(a.due_date).getTime() : -Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : -Infinity;
        return db - da;
      }
      return 0;
    }),
  [reminders, selectedVehicleId, selectedStatus, searchTerm, sortOption, vehicleMap]);

  const addHref = selectedVehicleId !== "all"
    ? `/reminders/new?vehicleId=${selectedVehicleId}`
    : "/reminders/new";

  if (remindersLoading || vehiclesLoading) return <div className="mx-auto max-w-5xl"><PageSkeleton /></div>;
  if (error) return <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">Failed to load reminders: {error.message}</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Maintenance Reminders</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {reminders.length === 0 ? "No reminders set" : `${reminders.length} reminder${reminders.length !== 1 ? "s" : ""} across all vehicles`}
          </p>
        </div>
        <Link
          href={addHref}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Reminder
        </Link>
      </div>

      {reminders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Bell className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="due_asc">Due Date (Earliest)</option>
              <option value="due_desc">Due Date (Latest)</option>
            </select>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No reminders yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Stay on top of oil changes, registrations, and inspections.
          </p>
          <Link
            href="/reminders/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Add First Reminder
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching reminders</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedVehicleId("all");
              setSelectedStatus("all");
              setSortOption("created_desc");
            }}
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reminder) => {
            const v = vehicleMap[reminder.vehicle_id];
            const vehicleName = v ? `${v.year} ${v.make} ${v.model}` : "Unknown Vehicle";
            const statusCls =
              reminder.status === "completed"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                : reminder.status === "cancelled"
                ? "bg-muted text-muted-foreground border-border/60"
                : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400";
            return (
              <div
                key={reminder.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{reminder.title}</h4>
                        <span className="rounded bg-muted px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {reminder.reminder_type}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider ${statusCls}`}>
                          {reminder.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          {vehicleName}
                        </span>
                        {reminder.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Due {new Date(reminder.due_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                          </span>
                        )}
                        {reminder.due_odometer !== null && reminder.due_odometer !== undefined && (
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5" />
                            Due {reminder.due_odometer.toLocaleString()} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {reminder.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                    {reminder.description}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-2">
                  <Link
                    href={`/reminders/${reminder.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <DeleteReminderButton reminderId={reminder.id} title={reminder.title} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
