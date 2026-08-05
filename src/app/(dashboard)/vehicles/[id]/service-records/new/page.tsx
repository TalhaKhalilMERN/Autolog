"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function NewServiceRecordRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: vehicleId } = React.use(params);
  redirect(`/services/new?vehicleId=${vehicleId}`);
}
