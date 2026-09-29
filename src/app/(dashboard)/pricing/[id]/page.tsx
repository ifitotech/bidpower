import { notFound, redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getPricingRequestById, getSuppliers } from "@/lib/services/pricing-requests";
import PricingDetail from "./PricingDetail";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PricingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  const request = await getPricingRequestById(id, c.companyId).catch(() => null);
  if (!request) notFound();
  const isReviewer = c.role === "owner" || c.role === "manager";
  const suppliers = isReviewer ? await getSuppliers(c.companyId).catch(() => []) : [];
  // RLS already returns no responses to people without view-costs; the flag only drives the notice.
  return <PricingDetail request={request} suppliers={suppliers} canManage={isReviewer} pricesVisible={isReviewer || c.perms.can_view_costs} />;
}
