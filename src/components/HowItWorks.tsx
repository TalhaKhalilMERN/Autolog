export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Add your vehicles",
      description: "Create a profile in seconds — VIN, plate, odometer. Bulk-import for fleets.",
    },
    {
      num: "02",
      title: "Log services & expenses",
      description: "Capture receipts on the go. Categorize automatically with smart suggestions.",
    },
    {
      num: "03",
      title: "Stay ahead with reminders",
      description: "Get nudges before things are due. Your dashboard tells you what matters today.",
    },
  ];

  return (
    <section id="how" className="relative border-t border-border bg-surface/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From first vehicle to full fleet in minutes
          </h2>
        </div>

        {/* Steps Grid */}
        <ol className="mt-16 grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/20"
            >
              <span className="text-sm font-semibold text-primary">{step.num}</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
