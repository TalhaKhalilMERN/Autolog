"use client";

import * as React from "react";
import { ExpenseForm } from "@/components/ExpenseForm";

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: expenseId } = React.use(params);
  return <ExpenseForm expenseId={expenseId} />;
}
