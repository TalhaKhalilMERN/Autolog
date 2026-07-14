"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Bell, User, Shield, Check, AlertCircle, Camera,
  Eye, EyeOff, LogOut, Trash2, KeyRound, Mail, MonitorCheck,
} from "lucide-react";
import { useUserSettings, useUpdateUserSettings } from "@/features/settings/hooks/use-user-settings";
import { useProfile, useUpdateProfile } from "@/features/settings/hooks/use-profile";
import { useSecuritySession, useChangePassword } from "@/features/settings/hooks/use-security";
import { createClient } from "@/lib/supabase/client";
import type { UserSettingsUpdate, UserProfileUpdate } from "@/lib/types";

/* ─── Notification schema ─── */
const settingsSchema = z.object({
  email_notifications: z.boolean(),
  notification_days_before: z.coerce.number().refine((val) => [0, 1, 3, 7].includes(val), {
    message: "Invalid timing selection.",
  }),
  notify_by_odometer: z.boolean(),
  odometer_threshold: z.coerce.number().refine((val) => [100, 250, 500, 1000].includes(val), {
    message: "Invalid mileage threshold selection.",
  }),
  notification_frequency: z.enum(["once", "daily"]),
});

type SettingsFormValues = {
  email_notifications: boolean;
  notification_days_before: number;
  notify_by_odometer: boolean;
  odometer_threshold: number;
  notification_frequency: "once" | "daily";
};

/* ─── Profile schema ─── */
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(80, "Full name must be under 80 characters."),
  country: z.string().max(100, "Country must be under 100 characters.").optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = {
  full_name: string;
  country?: string;
  timezone?: string;
};

/* ─── Change Password schema ─── */
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be under 72 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Must contain at least one number."),
    confirm_password: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type ChangePasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

/* ─── Common timezones ─── */
const TIMEZONES = [
  { value: "", label: "— Select timezone —" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Karachi", label: "Karachi (PKT)" },
  { value: "Asia/Kolkata", label: "Mumbai / Kolkata (IST)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Shanghai", label: "Beijing / Shanghai (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

/* ─── Options constants (notifications) ─── */
const TIMING_OPTIONS = [
  { value: 0, label: "On due date" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "7 days before" },
];

const ODOMETER_OPTIONS = [
  { value: 100, label: "100 km" },
  { value: 250, label: "250 km" },
  { value: 500, label: "500 km" },
  { value: 1000, label: "1000 km" },
];

const FREQUENCY_OPTIONS = [
  { value: "once", label: "Send once" },
  { value: "daily", label: "Daily until completed" },
];

const TABS = [
  { id: "notifications", label: "Notifications", icon: Bell, disabled: false },
  { id: "profile", label: "Profile", icon: User, disabled: false },
  { id: "security", label: "Security", icon: Shield, disabled: false },
];

/* ─── Shared helpers ─── */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputClass = (hasError?: boolean) =>
  `w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
    hasError
      ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
      : "border-border focus:ring-primary/30"
  }`;

const readonlyInputClass =
  "w-full rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none";

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <label className="flex items-center gap-1 text-sm font-medium text-foreground">
      {label}
      {optional && (
        <span className="text-xs font-normal text-muted-foreground">(optional)</span>
      )}
    </label>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 animate-in fade-in duration-200">
      <Check className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Security Tab                                */
/* ─────────────────────────────────────────── */
function SecurityTab() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useSecuritySession();
  const changePasswordMutation = useChangePassword();

  /* Password visibility toggles */
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  /* Feedback state */
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  /* Sign-out confirmation */
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetPwForm,
    formState: { errors: pwErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
  });

  const isSavingPw = changePasswordMutation.isPending;

  async function onChangePassword(data: ChangePasswordFormValues) {
    setPwSuccess(null);
    setPwError(null);
    try {
      await changePasswordMutation.mutateAsync({ new_password: data.new_password });
      setPwSuccess(
        "Password updated successfully. Use your new password the next time you sign in."
      );
      resetPwForm();
      setTimeout(() => setPwSuccess(null), 6000);
    } catch (err: any) {
      setPwError(err.message || "Failed to update password.");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
      setConfirmSignOut(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── 1. Change Password ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
            <KeyRound className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your account password.</p>
          </div>
        </div>

        <hr className="border-border/60" />

        {pwSuccess && <SuccessBanner message={pwSuccess} />}
        {pwError && <ErrorBanner message={pwError} />}

        <form onSubmit={handleSubmit(onChangePassword)} noValidate className="space-y-4">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Current Password" />
            {/* NOTE: Supabase does not verify the current password before updating.
                This field is present for UX purposes only. Proper verification would
                require re-authentication via supabase.auth.signInWithPassword before
                calling updateUser. See service layer TODO. */}
            <div className="relative">
              <input
                {...register("current_password")}
                type={showCurrentPw ? "text" : "password"}
                placeholder="Enter current password"
                disabled={isSavingPw}
                autoComplete="current-password"
                className={`${inputClass(!!pwErrors.current_password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showCurrentPw ? "Hide password" : "Show password"}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.current_password && (
              <p className="text-xs text-destructive" role="alert">{pwErrors.current_password.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="New Password" />
            <div className="relative">
              <input
                {...register("new_password")}
                type={showNewPw ? "text" : "password"}
                placeholder="At least 8 characters"
                disabled={isSavingPw}
                autoComplete="new-password"
                className={`${inputClass(!!pwErrors.new_password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showNewPw ? "Hide password" : "Show password"}
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.new_password ? (
              <p className="text-xs text-destructive" role="alert">{pwErrors.new_password.message}</p>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                <li>• 8–72 characters</li>
                <li>• 1 uppercase letter</li>
                <li>• 1 number</li>
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Confirm New Password" />
            <div className="relative">
              <input
                {...register("confirm_password")}
                type={showConfirmPw ? "text" : "password"}
                placeholder="Re-enter new password"
                disabled={isSavingPw}
                autoComplete="new-password"
                className={`${inputClass(!!pwErrors.confirm_password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.confirm_password && (
              <p className="text-xs text-destructive" role="alert">{pwErrors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingPw}
              className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {isSavingPw ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. Email Address ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">Email Address</h3>
            <p className="text-xs text-muted-foreground">
              Your login email and verification status.
            </p>
          </div>
        </div>

        <hr className="border-border/60" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {sessionLoading ? (
                <span className="inline-block h-4 w-48 animate-pulse rounded bg-muted" />
              ) : (
                session?.email || "—"
              )}
            </p>
            <div className="flex items-center gap-1.5">
              {!sessionLoading && session?.email_confirmed_at ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-500">Verified</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-amber-500">Not verified</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60"
            >
              Change Email
            </button>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2 border border-border/40">
          Email change functionality is coming soon. Contact support if you need to update your email address.
        </p>
      </div>

      {/* ── 3. Active Session ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
            <MonitorCheck className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">Active Session</h3>
            <p className="text-xs text-muted-foreground">
              Your current login session details.
            </p>
          </div>
        </div>

        <hr className="border-border/60" />

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">Session Status</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </dd>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">Last Sign-in</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {sessionLoading ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted" />
              ) : (
                formatDateTime(session?.last_sign_in_at ?? null)
              )}
            </dd>
          </div>
          <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">Auth Provider</dt>
            <dd className="mt-1 text-sm font-medium text-foreground capitalize">
              {sessionLoading ? (
                <span className="inline-block h-4 w-16 animate-pulse rounded bg-muted" />
              ) : (
                session?.provider || "Email"
              )}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          Advanced session management (active devices, force sign-out on all devices) will be added in a future update.
        </p>
      </div>

      {/* ── 4. Danger Zone ── */}
      <div className="rounded-2xl border border-destructive/40 bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">
            Irreversible or destructive actions. Proceed with caution.
          </p>
        </div>

        <hr className="border-destructive/20" />

        {/* Sign Out */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Sign Out</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              End your current session and return to the login page.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {!confirmSignOut ? (
              <button
                type="button"
                onClick={() => setConfirmSignOut(true)}
                className="flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-xs text-muted-foreground">Are you sure?</span>
                <button
                  type="button"
                  onClick={() => setConfirmSignOut(false)}
                  disabled={signingOut}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  {signingOut ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <LogOut className="h-3 w-3" />
                  )}
                  Confirm Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        <hr className="border-destructive/20" />

        {/* Delete Account */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data.
            </p>
            <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive/80 leading-relaxed">
                <span className="font-semibold">Warning:</span> This action is irreversible. Deleting your account will
                permanently remove all your vehicles, service records, expenses, maintenance reminders, and settings.
                There is no way to recover your data after deletion.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive/50 cursor-not-allowed opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
            <p className="mt-1.5 text-right text-[11px] text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Profile Tab                                 */
/* ─────────────────────────────────────────── */
function ProfileTab() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onBlur",
  });

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || "",
        country: profile.country || "",
        timezone: profile.timezone || "",
      });
    }
  }, [profile, reset]);

  const isSaving = updateProfileMutation.isPending;

  async function onSubmit(data: ProfileFormValues) {
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload: UserProfileUpdate = {
      full_name: data.full_name.trim(),
      country: data.country?.trim() || null,
      timezone: data.timezone?.trim() || null,
    };

    try {
      await updateProfileMutation.mutateAsync(payload);
      setSuccessMessage("Profile updated successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error.message || "Failed to load profile."} />;
  }

  const initials = getInitials(profile?.full_name || profile?.email || "?");

  return (
    <div className="space-y-6">
      {successMessage && <SuccessBanner message={successMessage} />}
      {errorMessage && <ErrorBanner message={errorMessage} />}

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
        <h3 className="text-lg font-semibold text-foreground">Your Profile</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your personal details visible across AutoLog.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow ring-4 ring-background">
              <span className="text-xl font-bold tracking-wide text-primary-foreground select-none">
                {initials}
              </span>
            </div>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm cursor-not-allowed opacity-70"
            >
              <Camera className="h-3 w-3" />
              <span>Upload</span>
              <span className="rounded-full bg-muted px-1 py-0.5 text-[9px] uppercase tracking-wider">
                Soon
              </span>
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className="text-lg font-semibold text-foreground">{profile?.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
              {profile?.country && (
                <span>
                  <span className="font-medium text-foreground">Country:</span>{" "}
                  {profile.country}
                </span>
              )}
              {profile?.timezone && (
                <span>
                  <span className="font-medium text-foreground">Timezone:</span>{" "}
                  {profile.timezone}
                </span>
              )}
              <span>
                <span className="font-medium text-foreground">Member since:</span>{" "}
                {formatDate(profile?.created_at || "")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Edit Profile</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Update your personal information below.</p>
        </div>

        <hr className="border-border/60" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Full Name" />
            <input
              {...register("full_name")}
              type="text"
              placeholder="e.g. Alex Morgan"
              disabled={isSaving}
              className={inputClass(!!errors.full_name)}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive" role="alert">{errors.full_name.message}</p>
            )}
          </div>

          {/* Read-only Email */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Email Address" />
            <input
              type="email"
              value={profile?.email || ""}
              readOnly
              tabIndex={-1}
              className={readonlyInputClass}
            />
            <p className="text-[11px] text-muted-foreground">
              Email address cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Read-only Member Since */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Member Since" />
            <input
              type="text"
              value={formatDate(profile?.created_at || "")}
              readOnly
              tabIndex={-1}
              className={readonlyInputClass}
            />
          </div>

          {/* Country + Timezone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Country" optional />
              <input
                {...register("country")}
                type="text"
                placeholder="e.g. Pakistan"
                disabled={isSaving}
                className={inputClass(!!errors.country)}
              />
              {errors.country && (
                <p className="text-xs text-destructive" role="alert">{errors.country.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Timezone" optional />
              <select
                {...register("timezone")}
                disabled={isSaving}
                className={`${inputClass(!!errors.timezone)} appearance-none`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              {errors.timezone && (
                <p className="text-xs text-destructive" role="alert">{errors.timezone.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Notifications Tab                           */
/* ─────────────────────────────────────────── */
function NotificationsTab() {
  const { data: settings, isLoading, error } = useUserSettings();
  const updateSettingsMutation = useUpdateUserSettings();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onChange",
  });

  const emailNotificationsWatched = useWatch({ control, name: "email_notifications" });
  const notifyByOdometerWatched = useWatch({ control, name: "notify_by_odometer" });

  useEffect(() => {
    if (settings) {
      reset({
        email_notifications: settings.email_notifications,
        notification_days_before: settings.notification_days_before,
        notify_by_odometer: settings.notify_by_odometer,
        odometer_threshold: settings.odometer_threshold,
        notification_frequency: settings.notification_frequency,
      });
    }
  }, [settings, reset]);

  const isSaving = updateSettingsMutation.isPending;

  async function onSubmit(data: SettingsFormValues) {
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload: UserSettingsUpdate = {
      email_notifications: data.email_notifications,
      notification_days_before: Number(data.notification_days_before),
      notify_by_odometer: data.notify_by_odometer,
      odometer_threshold: Number(data.odometer_threshold),
      notification_frequency: data.notification_frequency,
    };

    try {
      await updateSettingsMutation.mutateAsync(payload);
      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update settings preferences.");
    }
  }

  const disableScrollWheel = (e: React.WheelEvent<HTMLElement>) => {
    e.currentTarget.blur();
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error.message || "Failed to load notification settings."} />;
  }

  return (
    <div className="space-y-6">
      {successMessage && <SuccessBanner message={successMessage} />}
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure how and when you want to receive maintenance alerts.
            </p>
          </div>

          <hr className="border-border/60" />

          {/* Email Reminders */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-5 items-center">
                <input
                  id="email_notifications"
                  type="checkbox"
                  disabled={isSaving}
                  {...register("email_notifications")}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/30 outline-none cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="email_notifications" className="font-semibold text-foreground cursor-pointer select-none">
                  Email Reminders
                </label>
                <p className="text-xs text-muted-foreground">Enable email alerts for upcoming schedules or dates.</p>
              </div>
            </div>

            <div className="pl-7 grid gap-3 max-w-md">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Reminder Timing</label>
                <select
                  disabled={!emailNotificationsWatched || isSaving}
                  onWheel={disableScrollWheel}
                  {...register("notification_days_before")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {TIMING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.notification_days_before && (
                  <p className="text-xs text-destructive" role="alert">{errors.notification_days_before.message}</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Mileage Reminders */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-5 items-center">
                <input
                  id="notify_by_odometer"
                  type="checkbox"
                  disabled={isSaving}
                  {...register("notify_by_odometer")}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/30 outline-none cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div className="text-sm">
                <label htmlFor="notify_by_odometer" className="font-semibold text-foreground cursor-pointer select-none">
                  Mileage Reminders
                </label>
                <p className="text-xs text-muted-foreground">Enable alerts based on remaining kilometers.</p>
              </div>
            </div>

            <div className="pl-7 grid gap-3 max-w-md">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Notify when remaining mileage is:</label>
                <select
                  disabled={!notifyByOdometerWatched || isSaving}
                  onWheel={disableScrollWheel}
                  {...register("odometer_threshold")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ODOMETER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.odometer_threshold && (
                  <p className="text-xs text-destructive" role="alert">{errors.odometer_threshold.message}</p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Frequency */}
          <div className="space-y-4">
            <div className="text-sm">
              <h4 className="font-semibold text-foreground">Notification Frequency</h4>
              <p className="text-xs text-muted-foreground">Select how often alerts should repeat until resolved.</p>
            </div>
            <div className="grid gap-3 max-w-md">
              <div className="flex flex-col gap-1.5">
                <select
                  disabled={isSaving}
                  onWheel={disableScrollWheel}
                  {...register("notification_frequency")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.notification_frequency && (
                  <p className="text-xs text-destructive" role="alert">{errors.notification_frequency.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Preferences…
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Page                                        */
/* ─────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("notifications");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and notification controls.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar Tabs */}
        <aside className="flex flex-row gap-1 overflow-x-auto border-b border-border/60 pb-3 md:flex-col md:border-b-0 md:border-r md:border-border/60 md:pb-0 md:pr-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer select-none ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                {tab.label}
                {tab.disabled && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <div className="md:col-span-3">
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
