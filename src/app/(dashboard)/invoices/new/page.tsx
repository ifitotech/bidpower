import { getCurrentMember } from "@/lib/auth";
import { getClients } from "@/lib/services/clients";
import NewInvoiceForm from "./NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  let clients: { id: string; name: string }[] = [];
  try {
    const member = await getCurrentMember();
    if (member?.company_id) clients = (await getClients(member.company_id as string)).filter((c: { is_active?: boolean }) => c.is_active !== false).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));
  } catch {}
  return <NewInvoiceForm clients={clients} />;
}
