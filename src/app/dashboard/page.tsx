import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, User, Shield, CheckCircle } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = user.user_metadata?.full_name || "User";
  const email = user.email;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Grid overlay */}
      <div className="bg-grid absolute inset-0 animate-fade-in" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
              <Car className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">AutoLog</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground sm:inline-block">
              Logged in as <span className="font-medium text-foreground">{email}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Welcome back to your AutoLog account.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated
            </div>
          </div>

          <hr className="border-border/60 my-6" />

          {/* Profile Card */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/50 p-6">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Full Name</span>
                  <span className="font-medium text-foreground">{fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Email Address</span>
                  <span className="font-medium text-foreground">{email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/50 p-6">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Account Security
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">User ID</span>
                  <span className="font-mono text-xs text-foreground/80 break-all">{user.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Last Sign In</span>
                  <span className="font-medium text-foreground">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "First session"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt/Info Alert */}
          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/90">
            <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Phase 1 Authentication Complete!
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              This protected dashboard is secure. You can only view it if you are logged in. Feel free to sign out and log back in, or test the signup form.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
