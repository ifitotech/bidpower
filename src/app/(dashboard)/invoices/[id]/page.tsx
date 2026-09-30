import { notFound } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getInvoiceById } from "@/lib/services/invoices";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member?.company_id) notFound();
  const invoice = await getInvoiceById(id, member.company_id as string).catch(() => null);
  if (!invoice) notFound();
  return <InvoiceDetailClient invoice={invoice} />;
}
