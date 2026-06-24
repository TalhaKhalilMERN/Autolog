import Link from "next/link";
import { Car } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Top grid section */}
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand info */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
                <Car className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-foreground">AutoLog</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The modern home for vehicle maintenance and expenses.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="mt-4 space-y-3">
              {["Features", "Dashboard", "Pricing", "Changelog"].map((link) => (
                <li key={link}>
                  <Link
                    href={`#${link.toLowerCase()}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="mt-4 space-y-3">
              {["About", "Customers", "Careers", "Contact"].map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <p className="text-sm font-semibold text-foreground">Resources</p>
            <ul className="mt-4 space-y-3">
              {["Docs", "Guides", "Help center", "Status"].map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright/links */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 AutoLog, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Security"].map((policy) => (
              <Link key={policy} href="#" className="hover:text-foreground transition-colors">
                {policy}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
