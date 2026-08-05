"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function EditServiceRecordRedirect({
  params,
}: {
  params: Promise<{ id: string; serviceId: string }>;
}) {
  const { serviceId } = React.use(params);
  redirect(`/services/${serviceId}/edit`);
}
