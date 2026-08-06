"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Car,
  LayoutDashboard,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  Fuel,
  Wrench,
  DollarSign,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/fuel-logs", label: "Fuel Logs", icon: Fuel },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/activities", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  user,
  isCollapsed = false,
  onToggleCollapse,
  onNavClick,
}: {
  user: User;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
      {/* Logo Header */}
      <div
        className={`flex h-16 items-center border-b border-border/60 px-4 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-glow"
          >
            <Car className="h-4 w-4 text-primary-foreground" />
          </span>
          {!isCollapsed && (
            <span className="text-base font-semibold tracking-tight text-foreground truncate">
              AutoLog
            </span>
          )}
        </Link>

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              title={isCollapsed ? label : undefined}
              className={`group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all ${
                isCollapsed ? "justify-center px-2" : "px-3"
              } ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                  active ? "text-primary" : ""
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{label}</span>
                  {active && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/60 shrink-0" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="border-t border-border/60 p-3 space-y-1">
        {!isCollapsed ? (
          <>
            <div className="rounded-lg px-3 py-2">
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
              <span>Sign out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              title={user.email || "User"}
            >
              {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vehicles": "My Vehicles",
  "/vehicles/new": "Add Vehicle",
  "/services": "Service History",
  "/service-records": "Service History",
  "/expenses": "Expenses",
  "/fuel-logs": "Fuel Logs",
  "/fuel-logs/new": "Add Fuel Log",
  "/reminders": "Maintenance Reminders",
  "/activities": "Activity Log",
  "/activity": "Activity Log",
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load saved desktop sidebar state on mount
  useEffect(() => {
    const saved = localStorage.getItem("autolog_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Auto close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("autolog_sidebar_collapsed", String(next));
      return next;
    });
  };

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/vehicles/") ? "Vehicle Details" : "Dashboard");

  return (
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-border/60 bg-card transition-all duration-300 ease-in-out md:flex ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent
          user={user}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
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
            {/* Desktop Sidebar Toggle Button (only when collapsed) */}
            {isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="hidden md:flex rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            )}

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
