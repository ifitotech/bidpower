import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getCompanyRequests } from "@/lib/services/material-requests";
import RequestList from "@/app/(dashboard)/projects/[id]/materials/RequestList";

export const dynamic = "force-dynamic";

export default async function MaterialRequestsPage() {
  const c = await getActionContext().catch(() => null);
  if (!c || (c.role !== "owner" && c.role !== "manager")) redirect("/dashboard");
  try {
    return <RequestList requests={await getCompanyRequests(c.companyId)} showProject />;
  } catch {
    return <RequestList requests={[]} showProject error />;
  }
}
