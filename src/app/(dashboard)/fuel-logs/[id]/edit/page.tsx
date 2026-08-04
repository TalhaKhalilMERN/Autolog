"use client";

import * as React from "react";
import { FuelLogForm } from "@/components/FuelLogForm";

export default function EditFuelLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  return <FuelLogForm logId={id} />;
}
