import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getExpenses } from "@/lib/services/expenses";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

// The list only shows what the person may see (RLS): everything for Owner/Manager, their own otherwise.
export default async function ExpensesPage() {
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  const canCreate = c.perms.can_upload_documents || c.role === "owner";
  try {
    return <ExpensesClient expenses={await getExpenses(c.companyId)} canCreate={canCreate} />;
  } catch {
    return <ExpensesClient expenses={[]} canCreate={canCreate} error />;
  }
}
