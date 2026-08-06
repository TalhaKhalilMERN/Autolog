"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function NewExpenseRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: vehicleId } = React.use(params);
  redirect(`/expenses/new?vehicleId=${vehicleId}`);
}
