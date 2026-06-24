import { Car, Wrench, Fuel, TrendingUp, ArrowUpRight } from "lucide-react";

export function DashboardMockup() {
  const stats = [
    {
      label: "Vehicles",
      value: "12",
      trend: "+2 vs last month",
      trendType: "success",
      icon: Car,
    },
    {
      label: "Spend this month",
      value: "$3,482",
      trend: "-8.4% vs last month",
      trendType: "neutral",
      icon: TrendingUp,
    },
    {
      label: "Services logged",
      value: "47",
      trend: "+11 vs last month",
      trendType: "success",
      icon: Wrench,
    },
    {
      label: "Avg cost / mi",
      value: "$0.41",
      trend: "-2.1% vs last month",
      trendType: "neutral",
      icon: Fuel,
    },
  ];

  const chartData = [
    { month: "Jan", height: "65.625%" },
    { month: "Feb", height: "43.75%" },
    { month: "Mar", height: "87.5%" },
    { month: "Apr", height: "59.375%" },
    { month: "May", height: "100%" },
    { month: "Jun", height: "76.5625%" },
  ];

  const maintenance = [
    {
      title: "Tire rotation",
      vehicle: "Tesla Model 3",
      due: "in 320 mi",
      dueClass: "bg-warning/15 text-warning-foreground",
    },
    {
      title: "Oil & filter",
      vehicle: "Ford Transit",
      due: "in 6 days",
      dueClass: "bg-accent text-accent-foreground",
    },
    {
      title: "Brake inspection",
      vehicle: "Toyota RAV4",
      due: "in 2 weeks",
      dueClass: "bg-muted text-muted-foreground",
    },
  ];

  const expenses = [
    { name: "Fuel", vehicle: "Model 3", date: "Today", amount: "$42.10" },
    { name: "Service", vehicle: "Transit", date: "Yesterday", amount: "$318.00" },
    { name: "Insurance", vehicle: "RAV4", date: "Jun 22", amount: "$129.00" },
    { name: "Parts", vehicle: "Transit", date: "Jun 20", amount: "$87.40" },
  ];

  return (
    <section id="dashboard" className="relative py-24 sm:py-32">
      {/* Top Border Line */}
      <div className="bg-gradient-subtle absolute inset-x-0 top-0 h-px" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Every vehicle, every number, one calm view
          </h2>
          <p className="mt-4 text-muted-foreground">
            A focused interface that surfaces what's due, what's been spent, and what's next.
          </p>
        </div>

        {/* Browser Mockup Frame */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          {/* Browser Header Bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground selection:bg-primary/20">
              app.autolog.io / dashboard
            </div>
            <div className="w-10" />
          </div>

          {/* Dashboard Dashboard Body */}
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
            {/* KPI Stats Grid */}
            <div className="grid grid-cols-2 gap-3 lg:col-span-3 sm:grid-cols-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="rounded-xl border border-border bg-elevated p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className={`mt-1 text-xs ${stat.trendType === "success" ? "text-success" : "text-muted-foreground"}`}>
                      {stat.trend}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Spend by Category Card */}
            <div className="rounded-xl border border-border bg-elevated p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Spend by category</p>
                  <p className="text-xs text-muted-foreground">Last 6 months</p>
                </div>
                <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                  Open report <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
              
              {/* Chart Visualization */}
              <div className="mt-6">
                <div className="flex h-40 items-end gap-3">
                  {chartData.map((bar, idx) => (
                    <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-md bg-gradient-primary opacity-90 transition-all duration-500 hover:opacity-100 shadow-glow"
                        style={{ height: bar.height }}
                      />
                      <span className="text-[10px] text-muted-foreground">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Maintenance Card */}
            <div className="rounded-xl border border-border bg-elevated p-5">
              <p className="text-sm font-semibold text-foreground">Upcoming maintenance</p>
              <ul className="mt-4 space-y-3">
                {maintenance.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.vehicle}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${item.dueClass}`}>
                      {item.due}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Expenses List Card */}
            <div className="rounded-xl border border-border bg-elevated lg:col-span-3">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-sm font-semibold text-foreground">Recent expenses</p>
                <span className="text-xs text-muted-foreground">Updated just now</span>
              </div>
              <ul className="divide-y divide-border">
                {expenses.map((expense, idx) => (
                  <li
                    key={idx}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 text-sm sm:grid-cols-[1fr_1fr_auto_auto]"
                  >
                    <span className="font-medium text-foreground">{expense.name}</span>
                    <span className="hidden text-muted-foreground sm:inline">{expense.vehicle}</span>
                    <span className="text-muted-foreground">{expense.date}</span>
                    <span className="tabular-nums font-medium text-foreground text-right">
                      {expense.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
