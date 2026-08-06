"use client";

import Link from "next/link";
import {
  Car,
  Wrench,
  DollarSign,
  Plus,
  Bell,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  ChevronRight,
  ArrowUpRight,
  Activity,
  TrendingUp,
  BarChart3,
  Fuel,
  Zap,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useVehicles } from "@/features/vehicles/hooks/vehicles";
import { useExpenses } from "@/features/vehicles/hooks/use-expenses";
import { useServiceRecords } from "@/features/vehicles/hooks/use-service-records";
import { useReminders } from "@/features/vehicles/hooks/use-reminders";
import { useDashboardStats } from "@/features/vehicles/hooks/use-dashboard-stats";
import { useProfile } from "@/features/settings/hooks/use-profile";
import { useLatestActivities } from "@/features/activities/hooks/use-activities";
import type { Vehicle, Expense, MaintenanceReminder, ActivityLog, ActivityEntityType } from "@/lib/types";

/* ─── Formatting helpers ─── */
const fmt = {
  currency: (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  date: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  shortDate: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
};

function today() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysDiff(iso: string): number {
  const due = new Date(iso);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86400000);
}

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Skeleton ─── */
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className ?? ""}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevated">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/* ─── Quick Actions ─── */
const QUICK_ACTIONS = [
  { label: "Add Vehicle", href: "/vehicles/new", icon: Car },
  { label: "Log Service", href: "/vehicles", icon: Wrench },
  { label: "Add Expense", href: "/vehicles", icon: DollarSign },
  { label: "Set Reminder", href: "/vehicles", icon: Bell },
];

/* ─── Empty State ─── */
function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">{description}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
      >
        <Plus className="h-3.5 w-3.5" />
        {ctaLabel}
      </Link>
    </div>
  );
}

/* ─── Section Wrapper ─── */
function Section({
  title,
  description,
  cta,
  children,
}: {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {cta.label}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
  href,
  loading,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  accent: "primary" | "success" | "warning" | "destructive";
  href: string;
  loading: boolean;
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
    destructive: "bg-destructive/10 text-destructive",
  };

  if (loading) return <CardSkeleton />;

  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2.5 ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

/* ─── Activity Log Helpers ─── */
function getActivityBadge(type: ActivityEntityType | string) {
  switch (type) {
    case "vehicle":
      return { icon: Car, cls: "bg-primary/10 text-primary border-primary/20", label: "Vehicle" };
    case "service":
      return { icon: Wrench, cls: "bg-sky-500/10 text-sky-500 border-sky-500/20", label: "Service" };
    case "expense":
      return { icon: DollarSign, cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Expense" };
    case "fuel":
      return { icon: Fuel, cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Fuel Log" };
    case "reminder":
      return { icon: Bell, cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Reminder" };
    case "settings":
      return { icon: Settings, cls: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "Settings" };
    case "security":
      return { icon: ShieldCheck, cls: "bg-rose-500/10 text-rose-500 border-rose-500/20", label: "Security" };
    case "profile":
      return { icon: User, cls: "bg-violet-500/10 text-violet-500 border-violet-500/20", label: "Profile" };
    default:
      return { icon: Activity, cls: "bg-primary/10 text-primary border-primary/20", label: "System" };
  }
}

/* ─── Vehicle Card ─── */
function VehicleCard({
  vehicle,
  reminders,
}: {
  vehicle: Vehicle;
  reminders: MaintenanceReminder[];
}) {
  const vReminders = reminders.filter((r) => r.vehicle_id === vehicle.id && r.status === "pending");
  const todayStr = new Date().toISOString().split("T")[0];
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  const hasOverdue = vReminders.some((r) => r.due_date && r.due_date < todayStr);
  const hasUpcoming = vReminders.some(
    (r) => r.due_date && r.due_date >= todayStr && r.due_date <= in7DaysStr
  );

  let badge: { label: string; cls: string } | null = null;
  if (hasOverdue) {
    badge = { label: "Overdue Reminder", cls: "bg-destructive/10 text-destructive border-destructive/30" };
  } else if (hasUpcoming) {
    badge = { label: "Upcoming Service", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
  } else {
    badge = { label: "Healthy", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
  }

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Car className="h-5 w-5 text-primary" />
        </div>
        {badge && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="font-semibold text-foreground leading-tight">
          {vehicle.make} {vehicle.model}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {vehicle.year} · {vehicle.variant || "Standard"}
        </p>
        {vehicle.current_odometer != null && (
          <p className="mt-2 text-xs font-medium text-foreground">
            {vehicle.current_odometer.toLocaleString()} km
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-center text-xs font-medium text-foreground transition-all hover:bg-accent"
        >
          View
        </Link>
        <Link
          href={`/vehicles/${vehicle.id}/edit`}
          className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-center text-xs font-medium text-foreground transition-all hover:bg-accent"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

/* ─── Reminder Row ─── */
function ReminderRow({ reminder, vehicle }: { reminder: MaintenanceReminder; vehicle?: Vehicle }) {
  const days = reminder.due_date ? daysDiff(reminder.due_date) : null;
  const isOverdue = days !== null && days < 0;
  const isToday = days === 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOverdue ? "bg-destructive/10" : "bg-amber-500/10"}`}>
        <Bell className={`h-3.5 w-3.5 ${isOverdue ? "text-destructive" : "text-amber-500"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
        <p className="text-xs text-muted-foreground">
          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown vehicle"}
          {reminder.due_date && ` · Due ${fmt.date(reminder.due_date)}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {days !== null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOverdue
              ? "bg-destructive/10 text-destructive"
              : isToday
                ? "bg-amber-500/10 text-amber-500"
                : "bg-emerald-500/10 text-emerald-600"
            }`}>
            {isOverdue ? `${Math.abs(days)}d overdue` : isToday ? "Today" : `${days}d left`}
          </span>
        )}
        <Link
          href={`/vehicles/${reminder.vehicle_id}`}
          className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-accent"
        >
          View
        </Link>
      </div>
    </div>
  );
}

/* ─── Expense Summary ─── */
function ExpenseSummary({ expenses, loading }: { expenses: Expense[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-elevated space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    );
  }

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const serviceExpenses = expenses
    .filter((e) => e.service_record_id)
    .reduce((s, e) => s + Number(e.amount), 0);
  const manualExpenses = totalAmount - serviceExpenses;
  const servicePct = totalAmount > 0 ? Math.round((serviceExpenses / totalAmount) * 100) : 0;
  const manualPct = 100 - servicePct;

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No expenses recorded"
        description="Start logging expenses to see your spending breakdown."
        ctaLabel="Add expense"
        ctaHref="/vehicles"
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevated space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Total Fleet Expenses</p>
        <p className="text-3xl font-bold tabular-nums text-foreground mt-1">
          {fmt.currency(totalAmount)}
        </p>
      </div>

      <div className="space-y-3">
        {/* Service expenses bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Wrench className="h-3 w-3 text-primary" />
              Service Expenses
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{fmt.currency(serviceExpenses)}</span>
              <span className="text-xs font-semibold text-primary">{servicePct}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${servicePct}%` }}
            />
          </div>
        </div>

        {/* Manual expenses bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              Manual Expenses
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{fmt.currency(manualExpenses)}</span>
              <span className="text-xs font-semibold text-emerald-500">{manualPct}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${manualPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Chart Placeholder ─── */
function ChartPlaceholder({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/5 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Coming Soon
      </span>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: reminders = [], isLoading: remindersLoading } = useReminders();
  const { data: profile } = useProfile();
  const { data: latestActivities = [], isLoading: activitiesLoading } = useLatestActivities(10);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  // Upcoming reminders (pending, due_date set, sorted by date)
  const pendingReminders = reminders
    .filter((r) => r.status === "pending" && r.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 6);

  // KPI card configs
  const kpis = [
    {
      title: "Total Vehicles",
      value: stats?.vehicleCount ?? 0,
      description: "Vehicles in your fleet",
      icon: Car,
      accent: "primary" as const,
      href: "/vehicles",
    },
    {
      title: "Total Expenses",
      value: stats ? fmt.currency(stats.totalExpenses) : "—",
      description: "All-time fleet spending",
      icon: DollarSign,
      accent: "success" as const,
      href: "/vehicles",
    },
    {
      title: "Service Records",
      value: stats?.serviceRecordCount ?? 0,
      description: "Logged service events",
      icon: ClipboardList,
      accent: "primary" as const,
      href: "/vehicles",
    },
    {
      title: "Active Reminders",
      value: stats?.activeRemindersCount ?? 0,
      description: "Pending maintenance items",
      icon: Bell,
      accent: "warning" as const,
      href: "/vehicles",
    },
    {
      title: "Overdue",
      value: stats?.overdueRemindersCount ?? 0,
      description: "Past-due reminders",
      icon: AlertTriangle,
      accent: "destructive" as const,
      href: "/vehicles",
    },
    {
      title: "Due This Week",
      value: stats?.upcomingRemindersCount ?? 0,
      description: "Reminders in next 7 days",
      icon: CalendarClock,
      accent: "warning" as const,
      href: "/vehicles",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
        <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
        <div className="relative px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                AutoLog
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Welcome back, {firstName}! 👋
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{today()}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your fleet overview is ready. Keep your vehicles in top shape.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3.5 py-2 text-xs font-medium text-foreground backdrop-blur-sm transition-all hover:bg-accent hover:border-primary/30"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <Section title="Fleet Overview" description="Key metrics across your entire fleet">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} loading={statsLoading} />
          ))}
        </div>
      </Section>

      {/* ── Main Content Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Recent Activity Feed ── */}
          <Section
            title="Recent Activity"
            description="System activity audit log"
            cta={{ label: "View full log", href: "/activities" }}
          >
            <div className="rounded-xl border border-border bg-card shadow-elevated">
              {activitiesLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : latestActivities.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Activity}
                    title="No activity recorded yet"
                    description="Actions like adding vehicles, logging services, or updating settings will be logged here."
                    ctaLabel="Add vehicle"
                    ctaHref="/vehicles/new"
                  />
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {latestActivities.map((item: ActivityLog) => {
                    const badge = getActivityBadge(item.icon_type || item.entity_type);
                    const IconComp = badge.icon;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${badge.cls}`}>
                          <IconComp className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                            <span className={`rounded-full border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>

                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>

        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">

          {/* ── Expense Summary ── */}
          <Section title="Expense Summary">
            <ExpenseSummary expenses={expenses} loading={expensesLoading} />
          </Section>

          {/* ── Upcoming Reminders ── */}
          <Section
            title="Upcoming Reminders"
            description="Sorted by due date"
            cta={{ label: "View all", href: "/vehicles" }}
          >
            <div className="rounded-xl border border-border bg-card px-4 shadow-elevated">
              {remindersLoading ? (
                <div className="py-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingReminders.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={Bell}
                    title="No reminders"
                    description="Set a maintenance reminder to stay on top of your fleet."
                    ctaLabel="Set reminder"
                    ctaHref="/vehicles"
                  />
                </div>
              ) : (
                pendingReminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} vehicle={vehicleMap[r.vehicle_id]} />
                ))
              )}
            </div>
          </Section>

        </div>
      </div>

      {/* ── Vehicles Overview (Full Width) ── */}
      <Section
        title="Your Fleet"
        description="All registered vehicles"
        cta={{ label: "Manage vehicles", href: "/vehicles" }}
      >
        {vehiclesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-elevated space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-7 flex-1 rounded-lg" />
                  <Skeleton className="h-7 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles yet"
            description="Add your first vehicle to start tracking services and expenses."
            ctaLabel="Add vehicle"
            ctaHref="/vehicles/new"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} reminders={reminders} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Future: Charts placeholder (Full Width) ── */}
      <Section title="Analytics" description="Visual insights into your fleet data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ChartPlaceholder
            title="Expense Trends"
            description="Monthly expense chart over time"
            icon={TrendingUp}
          />
          <ChartPlaceholder
            title="Cost Per KM"
            description="Fuel and service cost per kilometer"
            icon={Fuel}
          />
          <ChartPlaceholder
            title="Service History"
            description="Service frequency and intervals"
            icon={BarChart3}
          />
          <ChartPlaceholder
            title="Vehicle Health Score"
            description="AI-based health metric per vehicle"
            icon={Zap}
          />
        </div>
      </Section>
    </div>
  );
}
