"use client";

import { useSearchParams } from "next/navigation";
import { FuelLogForm } from "@/components/FuelLogForm";

export default function NewFuelLogPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || undefined;

  return <FuelLogForm initialVehicleId={vehicleId} />;
}
