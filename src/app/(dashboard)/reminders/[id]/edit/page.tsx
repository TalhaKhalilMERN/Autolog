"use client";

import * as React from "react";
import { ReminderForm } from "@/components/ReminderForm";

export default function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: reminderId } = React.use(params);
  return <ReminderForm reminderId={reminderId} />;
}
