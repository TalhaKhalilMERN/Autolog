"use client";

import { useState, useMemo } from "react";
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

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label, valuePrefix = "$", valueSuffix = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-elevated text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-foreground border-b border-border/60 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
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

/* ─── Chart Card ─── */
function ChartCard({
  title,
  description,
  icon: Icon,
  headerSlot,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevated flex flex-col h-full min-h-[300px]">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {headerSlot && <div className="shrink-0">{headerSlot}</div>}
      </div>
      <div className="w-full flex-1 min-h-[230px] flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

/* ─── Vehicle Selector ─── */
function VehicleSelector({
  vehicles,
  selectedId,
  onChange,
}: {
  vehicles: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  if (vehicles.length === 0) return null;
  return (
    <select
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer max-w-[160px] truncate"
    >
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>
  );
}

/* ─── Skeleton ─── */
function ChartSkeleton() {
  return (
    <div className="space-y-3 p-2 w-full h-full flex flex-col justify-end">
      <div className="flex items-end justify-between gap-2 h-40">
        {[40, 65, 30, 80, 50, 90, 45, 70].map((h, i) => (
          <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
      <Skeleton className="h-3 w-full rounded" />
    </div>
  );
}

/* ─── Empty State ─── */
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
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 min-h-[220px]">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Fuel className="h-5 w-5" />
      </div>
      <div className="max-w-xs space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1">
          <PlusCircle className="h-3.5 w-3.5" />
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/* ─── Compact Y-axis formatter ─── */
function formatCurrencyAxis(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `$${v}`;
}

/* ─── Main Component ─── */
export function AnalyticsCharts() {
  const { data: analytics, isLoading, error } = useDashboardAnalytics();

  // Per-vehicle selection — empty string means "use first available"
  const [selectedSpendingId, setSelectedSpendingId] = useState("");
  const [selectedFuelId, setSelectedFuelId] = useState("");

  /* Build vehicle lists from already-fetched analytics data */
  const spendingVehicles = useMemo(
    () => analytics?.vehicleCosts.map((v) => ({ id: v.vehicleId, name: v.name })) ?? [],
    [analytics]
  );

  const fuelVehicles = useMemo(
    () => analytics?.fuelEconomy.byVehicle.map((v) => ({ id: v.vehicleId, name: v.vehicleName })) ?? [],
    [analytics]
  );

  // Resolve effective selection — fall back to first available
  const effectiveSpendingId = selectedSpendingId || spendingVehicles[0]?.id || "";
  const effectiveFuelId = selectedFuelId || fuelVehicles[0]?.id || "";

  // Slice per-vehicle data
  const selectedVehicleCost = analytics?.vehicleCosts.find((v) => v.vehicleId === effectiveSpendingId);
  const selectedFuelSeries = analytics?.fuelEconomy.byVehicle.find((v) => v.vehicleId === effectiveFuelId);

  // Build 3-bar chart data for single vehicle spending
  const singleVehicleSpendingBars = selectedVehicleCost
    ? [
        { category: "Fuel", amount: selectedVehicleCost.fuel },
        { category: "Services", amount: selectedVehicleCost.services },
        { category: "Other", amount: selectedVehicleCost.manual },
      ]
    : [];

  const spendingBarColors = ["var(--primary)", "#10b981", "#f59e0b"];

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
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

  const { monthlySpending, expenseBreakdown, fuelEconomy, totalLifetimeSpending } = analytics;

  const hasMonthlyData = monthlySpending.some((m) => m.total > 0);
  const hasBreakdownData = totalLifetimeSpending > 0;
  const hasSpendingData = !!selectedVehicleCost && selectedVehicleCost.total > 0;
  const hasFuelData = !!selectedFuelSeries && selectedFuelSeries.points.length > 0;

  const colors = { fuel: "var(--primary)", services: "#10b981", manual: "#f59e0b" };
  const axisTickStyle = { fill: "var(--muted-foreground)", fontSize: 11 };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">

      {/* ── CHART 1: Monthly Spending — all vehicles ── */}
      <ChartCard
        title="Monthly Spending"
        description="All vehicles — last 12 months"
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
          <div className="h-[230px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="shortMonth" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={formatCurrencyAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fuel" name="Fuel" stackId="a" fill={colors.fuel} radius={[0, 0, 0, 0]} />
                <Bar dataKey="services" name="Services" stackId="a" fill={colors.services} radius={[0, 0, 0, 0]} />
                <Bar dataKey="manual" name="Manual/Other" stackId="a" fill={colors.manual} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 2: Expense Breakdown — all vehicles ── */}
      <ChartCard
        title="Expense Breakdown"
        description="All vehicles — distribution by type"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full pt-2">
            <div className="h-[170px] w-full sm:w-1/2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
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
                <span className="text-base font-bold text-foreground">
                  ${totalLifetimeSpending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="w-full sm:w-1/2 space-y-2.5 sm:border-l sm:border-border/50 sm:pl-4">
              {expenseBreakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="font-semibold text-foreground">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                    <span className="text-[11px] text-muted-foreground font-mono w-10 text-right">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 3: Vehicle Spending — single vehicle ── */}
      <ChartCard
        title="Vehicle Spending"
        description={selectedVehicleCost ? `Total: $${selectedVehicleCost.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "Select a vehicle to view spending"}
        icon={Zap}
        headerSlot={
          spendingVehicles.length > 0 ? (
            <VehicleSelector
              vehicles={spendingVehicles}
              selectedId={effectiveSpendingId}
              onChange={setSelectedSpendingId}
            />
          ) : undefined
        }
      >
        {spendingVehicles.length === 0 ? (
          <ChartEmptyState
            title="No vehicle cost data"
            description="Add vehicles and log expenses to view per-vehicle spending."
            ctaLabel="Add vehicle"
            ctaHref="/vehicles/new"
          />
        ) : !hasSpendingData ? (
          <ChartEmptyState
            title="No spending for this vehicle"
            description="Log fuel, services, or expenses for this vehicle to see its spending breakdown."
            ctaLabel="Log expense"
            ctaHref="/expenses"
          />
        ) : (
          <div className="h-[230px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={singleVehicleSpendingBars} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <XAxis dataKey="category" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={formatCurrencyAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                  {singleVehicleSpendingBars.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={spendingBarColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* ── CHART 4: Fuel Economy — single vehicle ── */}
      <ChartCard
        title="Fuel Economy"
        description={
          selectedFuelSeries
            ? `Avg ${selectedFuelSeries.avgKmPerLiter} km/L — Full Tank logs`
            : "Select a vehicle to view efficiency"
        }
        icon={Fuel}
        headerSlot={
          fuelVehicles.length > 0 ? (
            <VehicleSelector
              vehicles={fuelVehicles}
              selectedId={effectiveFuelId}
              onChange={setSelectedFuelId}
            />
          ) : undefined
        }
      >
        {fuelVehicles.length === 0 ? (
          <ChartEmptyState
            title="No fuel economy data yet"
            description="Log at least 2 consecutive Full Tank refuellings for any vehicle to calculate real efficiency."
            ctaLabel="Log fuel"
            ctaHref="/fuel-logs"
          />
        ) : !hasFuelData ? (
          <ChartEmptyState
            title="Not enough Full Tank logs"
            description="Log at least 2 consecutive Full Tank refuellings for this vehicle to calculate its fuel efficiency."
            ctaLabel="Log fuel"
            ctaHref="/fuel-logs"
          />
        ) : (
          <div className="h-[230px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedFuelSeries!.points} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
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
