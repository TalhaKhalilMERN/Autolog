"use client";

import Link from "next/link";
import { Car, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Car className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">AutoLog</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 hover:-translate-y-px h-8 rounded-md px-3 text-xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 hover:-translate-y-px h-8 rounded-md px-3 text-xs"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
