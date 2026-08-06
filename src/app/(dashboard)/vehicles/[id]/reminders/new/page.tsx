"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function NewReminderRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: vehicleId } = React.use(params);
  redirect(`/reminders/new?vehicleId=${vehicleId}`);
}
