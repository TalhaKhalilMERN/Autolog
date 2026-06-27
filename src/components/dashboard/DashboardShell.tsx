"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Car, LayoutDashboard, Truck, Settings, LogOut, Menu, X, 
  ChevronRight 
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  user,
  onNavClick,
}: {
  user: User;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-glow"
        >
          <Car className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">
          AutoLog
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${active ? "text-primary" : ""}`} />
              {label}
              {active && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-border/60 p-3">
        <div className="mb-2 rounded-lg px-3 py-2">
          <p className="truncate text-xs font-medium text-foreground">
            {user.user_metadata?.full_name || "User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vehicles": "My Vehicles",
  "/vehicles/new": "Add Vehicle",
  "/settings": "Settings",
};

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/vehicles/") ? "Vehicle Details" : "Dashboard");

  return (
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-card md:flex">
        <SidebarContent user={user} />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border/60 bg-card transition-transform duration-300 md:hidden ${
          mobileOpen ? "flex translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent user={user} onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main Content Column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground sm:text-lg">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Page Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
