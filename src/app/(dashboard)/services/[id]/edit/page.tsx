"use client";

import * as React from "react";
import { ServiceForm } from "@/components/ServiceForm";

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: recordId } = React.use(params);
  return <ServiceForm recordId={recordId} />;
}
