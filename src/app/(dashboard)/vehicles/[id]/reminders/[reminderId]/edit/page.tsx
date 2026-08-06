"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function EditReminderRedirect({
  params,
}: {
  params: Promise<{ id: string; reminderId: string }>;
}) {
  const { reminderId } = React.use(params);
  redirect(`/reminders/${reminderId}/edit`);
}
