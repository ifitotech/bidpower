import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getPricingRequests } from "@/lib/services/pricing-requests";
import PricingList from "./PricingList";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const c = await getActionContext().catch(() => null);
  if (!c || !(c.role === "owner" || c.role === "manager" || c.perms.can_create_pricing_request)) redirect("/dashboard");
  try {
    return <PricingList requests={await getPricingRequests(c.companyId)} />;
  } catch {
    return <PricingList requests={[]} error />;
  }
}
