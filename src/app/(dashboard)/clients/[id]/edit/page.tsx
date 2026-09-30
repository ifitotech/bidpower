import { notFound, redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getClientById } from "@/lib/services/clients";
import EditClientForm from "./EditClientForm";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The form starts from the stored client, never from sample values. Only Owner/Manager edit clients (RLS agrees).
export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const c = await getActionContext().catch(() => null);
  if (!c || !(c.role === "owner" || c.role === "manager")) redirect("/clients");
  const client = await getClientById(id, c.companyId).catch(() => null);
  if (!client) notFound();
  return <EditClientForm client={{ id: client.id, name: client.name, contact_name: client.contact_name ?? null, email: client.email ?? null, phone: client.phone ?? null, address: client.address ?? null, notes: client.notes ?? null }} />;
}
