"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─────────────── Zod Schema ─────────────── */
const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Full name must be under 60 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens and apostrophes"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be under 72 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

/* ─────────────── Reusable Field ─────────────── */
function FormField({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────── Page ─────────────── */
export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessEmail(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message);
      } else {
        setSuccessEmail(data.email);
      }
    } catch (err: any) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successEmail) {
    return (
      <div className="flex flex-col items-center text-center py-4 animate-in fade-in duration-300">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Confirm your email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          We've sent a verification link to <span className="font-medium text-foreground">{successEmail}</span>. Please click the link in the email to activate your account.
        </p>
        <div className="mt-8 flex flex-col gap-3 w-full">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px"
          >
            Go to sign in
          </Link>
          <button
            onClick={() => setSuccessEmail(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
          >
            Try registering with another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Free 14-day Pro trial.{" "}
          <span className="text-primary font-medium">No credit card required.</span>
        </p>
      </div>

      {/* Server-level error */}
      {serverError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Full name */}
        <FormField label="Full name" id="fullName" error={errors.fullName?.message}>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            {...register("fullName")}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              errors.fullName
                ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                : "border-border"
            }`}
          />
        </FormField>

        {/* Work email */}
        <FormField label="Work email" id="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              errors.email
                ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                : "border-border"
            }`}
          />
        </FormField>

        {/* Password */}
        <FormField label="Password" id="password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                errors.password
                  ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                  : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength hints */}
          {!errors.password && (
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li>• 8+ characters</li>
              <li>• 1 uppercase letter</li>
              <li>• 1 number</li>
            </ul>
          )}
        </FormField>

        {/* Confirm password */}
        <FormField label="Confirm password" id="confirmPassword" error={errors.confirmPassword?.message}>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...register("confirmPassword")}
              className={`w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                  : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Divider + login link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

