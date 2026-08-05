"use client";

import { useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function NewExpensePage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || undefined;

  return <ExpenseForm initialVehicleId={vehicleId} />;
}
