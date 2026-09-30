import { getCurrentMember } from "@/lib/auth";
import { getPurchaseOrders } from "@/lib/services/purchase-orders";
import POsClient from "./POsClient";

export const dynamic = "force-dynamic";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export default async function POsPage() {
  try {
    const member = await getCurrentMember();
    if (member?.company_id) {
      const rows = await getPurchaseOrders(member.company_id as string);
      return <POsClient orders={(rows ?? []).map((r) => ({ ...r, project: one(r.project as { name?: string } | { name?: string }[] | null) })) as never} />;
    }
  } catch {}
  return <POsClient demo />;
}
