"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Fuel, BarChart3, Zap, PlusCircle } from "lucide-react";
import { useDashboardAnalytics } from "@/features/dashboard/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// Custom Tooltip component for Recharts matching AutoLog theme
function CustomTooltip({
  active,
  payload,
  label,
  valuePrefix = "$",
  valueSuffix = "",
}: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-elevated text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-foreground border-b border-border/60 pb-1">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}:
            </span>
            <span className="font-semibold text-foreground">
              {valuePrefix}
              {Number(entry.value).toLocaleString(undefined, {
                minimumFractionDigits: valueSuffix ? 1 : 2,
                maximumFractionDigits: 2,
              })}
              {valueSuffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Chart container wrapper matching dashboard cards
function ChartCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevated flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="w-full flex-1 min-h-[220px] flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

// Chart Skeleton Loader
function ChartSkeleton() {
  return (
    <div className="space-y-3 p-2 w-full h-full flex flex-col justify-end">
      <div className="flex items-end justify-between gap-2 h-36">
        {[40, 65, 30, 80, 50, 90, 45, 70].map((h, i) => (
          <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
      <Skeleton className="h-3 w-full rounded" />
    </div>
  );
}

// Empty State for Chart
function ChartEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 min-h-[200px]">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Fuel className="h-5 w-5" />
      </div>
      <div className="max-w-xs space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export function AnalyticsCharts() {
  const { data: analytics, isLoading, error } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-elevated space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <ChartSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-elevated text-center text-xs text-muted-foreground">
        Failed to load analytics charts. Please refresh or try again later.
      </div>
    );
  }

  const { monthlySpending, expenseBreakdown, vehicleCosts, fuelEconomy, totalLifetimeSpending } = analytics;

  const hasMonthlyData = monthlySpending.some((m) => m.total > 0);
  const hasBreakdownData = totalLifetimeSpending > 0;
  const hasVehicleData = vehicleCosts.length > 0;

  // Accessible theme colors for charts
  const colors = {
    fuel: "var(--primary)",
    services: "#10b981", // Emerald
    manual: "#f59e0b",   // Amber
  };

  const axisTickStyle = { fill: "var(--muted-foreground)", fontSize: 10 };
  const vehicleAxisTickStyle = { fill: "var(--muted-foreground)", fontSize: 10 };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
      {/* ── CHART 1: Monthly Vehicle Spending (Bar Chart) ── */}
      <ChartCard
        title="Monthly Spending"
        description="Last 12 months spending breakdown"
        icon={TrendingUp}
      >
        {!hasMonthlyData ? (
          <ChartEmptyState
            title="No spending data yet"
            description="Log services, fuel, or manual expenses to view monthly spending trends over time."
            ctaLabel="Add expense"
            ctaHref="/expenses"
          />
        ) : (
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="shortMonth" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fuel" name="Fuel" stackId="a" fill={colors.fuel} radius={[0, 0, 0, 0]} />
                <Bar dataKey="services" name="Services" stackId="a" fill={colors.services} radius={[0, 0, 0, 0]} />
                <Bar dataKey="manual" name="Manual/Other" stackId="a" fill={colors.manual} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 2: Expense Breakdown (Donut Chart) ── */}
      <ChartCard
        title="Expense Breakdown"
        description="Distribution by expense type"
        icon={BarChart3}
      >
        {!hasBreakdownData ? (
          <ChartEmptyState
            title="No expenses recorded"
            description="Start logging expenses to view your vehicle cost breakdown."
            ctaLabel="Log expense"
            ctaHref="/expenses"
          />
        ) : (
          <div className="flex flex-col items-center justify-between h-full pt-2">
            <div className="h-[140px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total</span>
                <span className="text-sm font-bold text-foreground">
                  ${totalLifetimeSpending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Category breakdown list */}
            <div className="w-full space-y-1.5 pt-2 border-t border-border/50">
              {expenseBreakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="font-medium text-foreground">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                    <span className="text-[10px] text-muted-foreground font-mono w-9 text-right">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 3: Vehicle Cost Comparison (Horizontal Bar) ── */}
      <ChartCard
        title="Vehicle Comparison"
        description="Total spending per vehicle"
        icon={Zap}
      >
        {!hasVehicleData ? (
          <ChartEmptyState
            title="No vehicle cost data"
            description="Add vehicles and log expenses to compare ownership costs."
            ctaLabel="Add vehicle"
            ctaHref="/vehicles/new"
          />
        ) : (
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={vehicleCosts.slice(0, 5)}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={vehicleAxisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tickFormatter={(val) => (val.length > 12 ? `${val.substring(0, 11)}…` : val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fuel" name="Fuel" stackId="a" fill={colors.fuel} />
                <Bar dataKey="services" name="Services" stackId="a" fill={colors.services} />
                <Bar dataKey="manual" name="Manual" stackId="a" fill={colors.manual} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 4: Fuel Economy Trend (Line Chart) ── */}
      <ChartCard
        title="Fuel Economy Trend"
        description="Efficiency (km/L) from Full Tank logs"
        icon={Fuel}
      >
        {!fuelEconomy.hasEnoughData ? (
          <ChartEmptyState
            title="Add more Full Tank logs"
            description="Log at least 2 consecutive Full Tank refuellings to calculate real fuel efficiency."
            ctaLabel="Log fuel"
            ctaHref="/fuel-logs"
          />
        ) : (
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelEconomy.overallTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="formattedDate" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<CustomTooltip valuePrefix="" valueSuffix=" km/L" />} />
                <Line
                  type="monotone"
                  dataKey="kmPerLiter"
                  name="Fuel Economy"
                  stroke={colors.fuel}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: colors.fuel }}
                  activeDot={{ r: 6, stroke: "var(--background)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
