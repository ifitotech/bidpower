import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupplierData } from "@/components/supplier/SupplierRequestForm";
import SupplyRequestView from "./SupplyRequestView";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SupplyRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  // The database function checks membership, the active connection and the invitation.
  const { data } = await supabase.rpc("supply_get_request", { p_invitation: id });
  if (!data) notFound();
  return <SupplyRequestView invitationId={id} data={data as SupplierData} />;
}
