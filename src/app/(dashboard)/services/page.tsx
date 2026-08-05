"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Wrench,
  Search,
  Filter,
  Calendar,
  Gauge,
  Pencil,
  Car,
} from "lucide-react";
import { useServiceRecords } from "@/features/vehicles/hooks/use-service-records";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { DeleteServiceRecordButton } from "@/components/DeleteServiceRecordButton";

function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-8 w-48 rounded bg-muted/60" />
        <div className="h-10 w-36 rounded bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded bg-muted/60" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get("vehicleId") || "all";

  const { data: records = [], isLoading: recordsLoading, error } = useServiceRecords();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(initialVehicleId);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const vehicleMap = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedVehicleId !== "all" && r.vehicle_id !== selectedVehicleId) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const v = vehicleMap[r.vehicle_id];
          const vehicleStr = v ? `${v.make} ${v.model} ${v.registration_number ?? ""}`.toLowerCase() : "";
          if (
            !r.service_type.toLowerCase().includes(term) &&
            !(r.notes ?? "").toLowerCase().includes(term) &&
            !vehicleStr.includes(term)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(a.service_date).getTime() - new Date(b.service_date).getTime();
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [records, selectedVehicleId, searchTerm, sortOrder, vehicleMap]);

  const addHref = selectedVehicleId !== "all"
    ? `/services/new?vehicleId=${selectedVehicleId}`
    : "/services/new";

  if (recordsLoading || vehiclesLoading) {
    return <div className="mx-auto max-w-5xl"><PageSkeleton /></div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Failed to load service records: {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header with Add Service Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Service History</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {records.length === 0
              ? "No service records yet"
              : `${records.length} record${records.length !== 1 ? "s" : ""} across all vehicles`}
          </p>
        </div>
        <Link
          href={addHref}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      {/* Filters */}
      {records.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search service type, notes..."
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
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
              className="w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {/* List / Empty states */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No service records yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Log maintenance events like oil changes, tire rotations, and tune-ups.
          </p>
          <Link
            href="/services/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Add First Service
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No matching records</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or filters.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedVehicleId("all");
            }}
            className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => {
            const vehicle = vehicleMap[record.vehicle_id];
            const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Unknown Vehicle";
            return (
              <div
                key={record.id}
                className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-elevated transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground">{record.service_type}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          {vehicleName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(record.service_date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" />
                          {record.mileage.toLocaleString()} km
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-lg font-bold text-foreground tabular-nums">
                      ${Number(record.cost).toFixed(2)}
                    </span>
                  </div>
                </div>
                {record.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 border border-border/40 leading-relaxed">
                    {record.notes}
                  </p>
                )}
                {/* Module-owned Edit and Delete */}
                <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                  <Link
                    href={`/services/${record.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <DeleteServiceRecordButton recordId={record.id} serviceType={record.service_type} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
