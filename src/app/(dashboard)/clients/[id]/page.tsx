import { notFound } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getClientById } from "@/lib/services/clients";
import ClientDetailClient from "./ClientDetailClient";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member?.company_id) notFound();
  const client = await getClientById(id, member.company_id as string).catch(() => null);
  if (!client) notFound();
  return <ClientDetailClient client={client} />;
}
