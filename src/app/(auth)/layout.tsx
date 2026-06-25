import Link from "next/link";
import { Car } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Grid overlay */}
      <div className="bg-grid absolute inset-0" aria-hidden="true" />

      {/* Page content */}
      <div className="relative flex min-h-screen flex-col items-center px-4 py-12 sm:py-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow"
          >
            <Car className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            AutoLog
          </span>
        </Link>

        {/* Card */}
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated">
          {children}
        </div>
      </div>
    </div>
  );
}
