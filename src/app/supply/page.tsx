import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth";
import SupplyInbox, { type InboxRow } from "./SupplyInbox";

export const dynamic = "force-dynamic";

export default async function SupplyHome() {
  const member = await getCurrentMember().catch(() => null);
  const companyId = member?.company_id as string | undefined;
  if (!companyId) return <SupplyInbox rows={[]} error />;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("supply_inbox", { p_company: companyId });
  if (error) return <SupplyInbox rows={[]} error />;
  return <SupplyInbox rows={(data ?? []) as InboxRow[]} />;
}
