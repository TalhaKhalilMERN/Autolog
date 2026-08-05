"use client";

import { useSearchParams } from "next/navigation";
import { ServiceForm } from "@/components/ServiceForm";

export default function NewServicePage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || undefined;

  return <ServiceForm initialVehicleId={vehicleId} />;
}
