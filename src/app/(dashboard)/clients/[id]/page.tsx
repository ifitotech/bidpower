import { notFound } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getClientById } from "@/lib/services/clients";
import { getClientInvoices } from "@/lib/services/invoices";
import { effectiveInvoiceStatus } from "@/lib/invoice-status";
import ClientDetailClient from "./ClientDetailClient";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member?.company_id) notFound();
  const client = await getClientById(id, member.company_id as string).catch(() => null);
  if (!client) notFound();
  const canSeeMoney = member.role === "owner" || member.role === "manager";
  const billing = canSeeMoney ? await getClientInvoices(id, member.company_id as string).catch(() => null) : null;
  return <ClientDetailClient client={client} billing={billing ? { owed: billing.owed, invoices: billing.rows.map((i) => ({ ...i, status: effectiveInvoiceStatus(i.status, i.due_date, i.total, i.amount_paid) })) } : null} />;
}
