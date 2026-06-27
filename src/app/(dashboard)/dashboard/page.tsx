import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/services/dashboard";
import Link from "next/link";
import { Car, Wrench, DollarSign, ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = (user?.user_metadata?.full_name as string | undefined)
    ?.split(" ")[0] ?? "there";

  // ── Data via service layer ──────────────────────────────────────────────
  const statsResult = await getDashboardStats(supabase);
  const vehicleCount = statsResult.data?.vehicleCount ?? 0;

  const stats = [
    {
      label: "Total Vehicles",
      value: vehicleCount,
      icon: Car,
      href: "/vehicles",
      cta: "View vehicles",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Upcoming Services",
      value: "—",
      icon: Wrench,
      href: "#",
      cta: "Coming soon",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Total Expenses",
      value: "—",
      icon: DollarSign,
      href: "#",
      cta: "Coming soon",
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AutoLog
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {firstName}! 👋
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Here&apos;s an overview of your fleet. Track services, expenses, and more.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/vehicles/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
            >
              <Plus className="h-4 w-4" />
              Add vehicle
            </Link>
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
            >
              View all vehicles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href, cta, color, bg }) => (
          <div
            key={label}
            className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-elevated transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <Link
                href={href}
                className={`text-xs font-medium ${color} opacity-0 transition-opacity group-hover:opacity-100`}
              >
                {cta} →
              </Link>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {value}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty-fleet prompt */}
      {vehicleCount === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No vehicles yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first vehicle to start tracking services and expenses.
          </p>
          <Link
            href="/vehicles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            <Plus className="h-4 w-4" />
            Add your first vehicle
          </Link>
        </div>
      )}
    </div>
  );
}
