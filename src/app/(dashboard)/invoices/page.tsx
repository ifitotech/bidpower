import { getCurrentMember } from "@/lib/auth";
import { getInvoices } from "@/lib/services/invoices";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  try {
    const member = await getCurrentMember();
    if (!member?.company_id) throw new Error("no_company");
    return <InvoicesClient invoices={await getInvoices(member.company_id as string)} />;
  } catch {
    return <InvoicesClient invoices={[]} error />;
  }
}
