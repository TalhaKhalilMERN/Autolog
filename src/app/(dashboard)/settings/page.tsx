"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Loader2, Bell, User, Shield, Check, AlertCircle } from "lucide-react";
import { useUserSettings, useUpdateUserSettings } from "@/features/settings/hooks/use-user-settings";
import type { UserSettingsUpdate } from "@/lib/types";

/* ─── Schema ─── */
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

/* ─── Options Constants ─── */
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
  { id: "profile", label: "Profile", icon: User, disabled: true },
  { id: "security", label: "Security", icon: Shield, disabled: true },
];

export default function SettingsPage() {
  const { data: settings, isLoading, error } = useUserSettings();
  const updateSettingsMutation = useUpdateUserSettings();

  const [activeTab, setActiveTab] = useState("notifications");
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

  // Watch toggles to conditionally disable dropdowns in UI
  const emailNotificationsWatched = useWatch({ control, name: "email_notifications" });
  const notifyByOdometerWatched = useWatch({ control, name: "notify_by_odometer" });

  // Pre-load default values once data is fetched
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
      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update settings preferences.");
    }
  }

  // Prevent scroll wheel modifying numbers in selectors/checkboxes
  const disableScrollWheel = (e: React.WheelEvent<HTMLElement>) => {
    e.currentTarget.blur();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading preferences…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Error Loading Settings</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "Something went wrong."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and notification controls.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Settings Sidebar Tabs */}
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
          {activeTab === "notifications" && (
            <div className="space-y-6">
              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 animate-in fade-in duration-200">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                {/* Notification Preferences Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure how and when you want to receive maintenance alerts.
                    </p>
                  </div>

                  <hr className="border-border/60" />

                  {/* Email Reminders Section */}
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
                        <p className="text-xs text-muted-foreground">
                          Enable email alerts for upcoming schedules or dates.
                        </p>
                      </div>
                    </div>

                    <div className="pl-7 grid gap-3 max-w-md">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Reminder Timing
                        </label>
                        <select
                          disabled={!emailNotificationsWatched || isSaving}
                          onWheel={disableScrollWheel}
                          {...register("notification_days_before")}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {TIMING_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors.notification_days_before && (
                          <p className="text-xs text-destructive" role="alert">
                            {errors.notification_days_before.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Mileage Reminders Section */}
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
                        <p className="text-xs text-muted-foreground">
                          Enable alerts based on remaining kilometers.
                        </p>
                      </div>
                    </div>

                    <div className="pl-7 grid gap-3 max-w-md">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Notify when remaining mileage is:
                        </label>
                        <select
                          disabled={!notifyByOdometerWatched || isSaving}
                          onWheel={disableScrollWheel}
                          {...register("odometer_threshold")}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {ODOMETER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors.odometer_threshold && (
                          <p className="text-xs text-destructive" role="alert">
                            {errors.odometer_threshold.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Frequency Settings */}
                  <div className="space-y-4">
                    <div className="text-sm">
                      <h4 className="font-semibold text-foreground">Notification Frequency</h4>
                      <p className="text-xs text-muted-foreground">
                        Select how often alerts should be repeating until marked resolved.
                      </p>
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
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {errors.notification_frequency && (
                          <p className="text-xs text-destructive" role="alert">
                            {errors.notification_frequency.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
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
          )}
        </div>
      </div>
    </div>
  );
}
