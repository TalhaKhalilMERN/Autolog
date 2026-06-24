import { Car, Wrench, Receipt, BellRing, ChartColumn, Users } from "lucide-react";

export function Features() {
  const featuresList = [
    {
      icon: Car,
      title: "Vehicle management",
      description: "One profile per vehicle with VIN, mileage, photos and documents kept neatly in sync.",
    },
    {
      icon: Wrench,
      title: "Service history",
      description: "Log every service, part and shop. A complete, searchable timeline for each vehicle.",
    },
    {
      icon: Receipt,
      title: "Expense tracking",
      description: "Capture fuel, repairs and insurance with receipts. Export clean reports any time.",
    },
    {
      icon: BellRing,
      title: "Maintenance reminders",
      description: "Smart reminders based on mileage, time or manufacturer schedules — never miss a service.",
    },
    {
      icon: ChartColumn,
      title: "Dashboard analytics",
      description: "Cost per mile, upcoming work and category breakdowns surfaced in clear charts.",
    },
    {
      icon: Users,
      title: "Fleet ready",
      description: "Invite drivers, assign vehicles and roll up insights across the whole fleet.",
    },
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A complete operating system for your vehicles
          </h2>
          <p className="mt-4 text-muted-foreground">
            Purpose-built modules that feel like one product, not six. Designed to scale from a single car to a serious fleet.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                {/* Icon wrapper with group-hover transition */}
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground transition-all duration-300 group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                  <IconComponent className="h-5 w-5" aria-hidden="true" />
                </div>
                
                {/* Feature Content */}
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
