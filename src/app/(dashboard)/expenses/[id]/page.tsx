import { notFound, redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getExpenseById } from "@/lib/services/expenses";
import ExpenseDetail from "./ExpenseDetail";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ExpensePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ receipt?: string }> }) {
  const { id } = await params;
  const { receipt } = await searchParams;
  if (!UUID.test(id)) notFound();
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  const expense = await getExpenseById(id, c.companyId).catch(() => null);
  if (!expense) notFound();
  const reviewer = c.role === "owner" || c.role === "manager";
  return <ExpenseDetail expense={expense} isReviewer={reviewer} canCancel={expense.created_by === c.userId || reviewer} receiptFailed={receipt === "failed"} />;
}
