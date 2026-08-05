"use client";

import { useSearchParams } from "next/navigation";
import { ReminderForm } from "@/components/ReminderForm";

export default function NewReminderPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || undefined;

  return <ReminderForm initialVehicleId={vehicleId} />;
}
