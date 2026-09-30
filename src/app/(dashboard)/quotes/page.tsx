import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getQuotes } from "@/lib/services/quotes";
import QuotesClient from "./QuotesClient";

export const dynamic = "force-dynamic";

// Proposals (customer quotes). Prices are Owner/Manager information (or "create proposals" permission, enforced by RLS).
export default async function QuotesPage() {
  const c = await getActionContext().catch(() => null);
  if (!c || !(c.role === "owner" || c.role === "manager" || c.perms.can_create_proposal)) redirect("/dashboard");
  try {
    return <QuotesClient quotes={await getQuotes(c.companyId)} canCreate={c.role === "owner" || c.role === "manager"} />;
  } catch {
    return <QuotesClient quotes={[]} canCreate={false} error />;
  }
}
