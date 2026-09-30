import { notFound, redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getQuoteById } from "@/lib/services/quotes";
import { getProposalExtras } from "@/lib/services/proposals";
import QuoteDetailClient from "./QuoteDetailClient";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  // Company filter here, visibility (Owner/Manager or "create proposals") in the database.
  const quote = await getQuoteById(id, c.companyId).catch(() => null);
  if (!quote) notFound();
  const extras = await getProposalExtras(id, c.companyId, quote.number).catch(() => null);
  return <QuoteDetailClient quote={quote} extras={extras} canManage={c.role === "owner" || c.role === "manager"} />;
}
