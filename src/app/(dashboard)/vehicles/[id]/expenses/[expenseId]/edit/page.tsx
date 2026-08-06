"use client";

import * as React from "react";
import { redirect } from "next/navigation";

export default function EditExpenseRedirect({
  params,
}: {
  params: Promise<{ id: string; expenseId: string }>;
}) {
  const { expenseId } = React.use(params);
  redirect(`/expenses/${expenseId}/edit`);
}
