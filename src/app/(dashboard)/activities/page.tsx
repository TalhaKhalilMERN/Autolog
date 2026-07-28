"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Car,
  Wrench,
  DollarSign,
  Bell,
  Settings,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Filter,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useActivities } from "@/features/activities/hooks/use-activities";
import type { ActivityEntityType, ActivityLog } from "@/lib/types";

/* ─── Relative time helper ─── */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Entity Icon & Style Mapper ─── */
function getEntityStyle(entityType: ActivityEntityType | string) {
  switch (entityType) {
    case "vehicle":
      return {
        icon: Car,
        iconCls: "bg-primary/10 text-primary ring-primary/20",
        badgeCls: "bg-primary/10 text-primary border-primary/20",
        label: "Vehicle",
      };
    case "service":
      return {
        icon: Wrench,
        iconCls: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
        badgeCls: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        label: "Service",
      };
    case "expense":
      return {
        icon: DollarSign,
        iconCls: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
        badgeCls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        label: "Expense",
      };
    case "reminder":
      return {
        icon: Bell,
        iconCls: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
        badgeCls: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        label: "Reminder",
      };
    case "settings":
      return {
        icon: Settings,
        iconCls: "bg-slate-500/10 text-slate-500 ring-slate-500/20",
        badgeCls: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
        label: "Settings",
      };
    case "security":
      return {
        icon: ShieldCheck,
        iconCls: "bg-rose-500/10 text-rose-500 ring-rose-500/20",
        badgeCls: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        label: "Security",
      };
    case "profile":
      return {
        icon: User,
        iconCls: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
        badgeCls: "bg-violet-500/10 text-violet-500 border-violet-500/20",
        label: "Profile",
      };
    default:
      return {
        icon: Activity,
        iconCls: "bg-primary/10 text-primary ring-primary/20",
        badgeCls: "bg-primary/10 text-primary border-primary/20",
        label: "System",
      };
  }
}

/* ─── Skeleton ─── */
function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse"
        >
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 rounded bg-muted/60" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>
            <div className="h-3 w-3/4 rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter Categories ─── */
const FILTERS: { id: ActivityEntityType | "all"; label: string }[] = [
  { id: "all", label: "All Activity" },
  { id: "vehicle", label: "Vehicles" },
  { id: "service", label: "Services" },
  { id: "expense", label: "Expenses" },
  { id: "reminder", label: "Reminders" },
  { id: "settings", label: "Settings" },
  { id: "security", label: "Security" },
  { id: "profile", label: "Profile" },
];

export default function ActivitiesPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<ActivityEntityType | "all">("all");
  const limit = 15;

  const { data, isLoading, error, refetch, isFetching } = useActivities({
    page,
    limit,
    entityType: selectedCategory,
  });

  const activities = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  function handleCategoryChange(cat: ActivityEntityType | "all") {
    setSelectedCategory(cat);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Activity Log</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {total} {total === 1 ? "event" : "events"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete audit history of changes across your garage and account settings.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 pb-3 text-sm">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground mr-1" />
        {FILTERS.map((filter) => {
          const active = selectedCategory === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => handleCategoryChange(filter.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer select-none ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* ── Content Pane ── */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <Activity className="mx-auto h-10 w-10 text-destructive mb-3" />
          <h3 className="text-base font-semibold text-foreground">Error Loading Activity Log</h3>
          <p className="mt-1 text-xs text-muted-foreground">{error.message || "Failed to load activity logs."}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      ) : activities.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No activity recorded yet</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-sm">
            {selectedCategory === "all"
              ? "Actions like adding vehicles, logging services, or creating reminders will automatically be logged here."
              : `No activity found under the "${selectedCategory}" category.`}
          </p>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 rounded-lg bg-muted px-4 py-2 text-xs font-medium text-foreground hover:bg-accent cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        /* Timeline Feed */
        <div className="space-y-3">
          {activities.map((item: ActivityLog) => {
            const style = getEntityStyle(item.icon_type || item.entity_type);
            const IconComponent = style.icon;

            return (
              <div
                key={item.id}
                className="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-elevated transition-all hover:border-primary/30 hover:shadow-md"
              >
                {/* Icon Badge */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm transition-transform group-hover:scale-105 ${style.iconCls}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badgeCls}`}
                      >
                        {style.label}
                      </span>
                    </div>

                    <span
                      title={formatFullDateTime(item.created_at)}
                      className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"
                    >
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}

          {/* ── Pagination Controls ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-4 mt-6">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Showing page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span> ({total} total entries)
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <span className="px-2 text-xs font-medium text-muted-foreground">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
