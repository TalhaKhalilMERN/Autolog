import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background Grid Mask */}
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      
      {/* Main Content Container */}
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-28 sm:px-6 sm:pt-32 sm:pb-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>Built for owners, fleets and enthusiasts</span>
          </div>
          
          {/* Title */}
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Everything your vehicle needs,{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              in one log.
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            AutoLog is the modern home for service history, expenses and maintenance reminders. Less paperwork, more clarity — for one car or an entire fleet.
          </p>
          
          {/* Call to Actions */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 hover:-translate-y-px h-12 rounded-lg px-7 text-base"
            >
              Start tracking free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="#dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background/60 backdrop-blur hover:bg-accent hover:text-accent-foreground h-12 rounded-lg px-7 text-base"
            >
              See the dashboard
            </Link>
          </div>
          
          {/* Notice */}
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · 14-day Pro trial
          </p>
        </div>
      </div>
    </section>
  );
}
