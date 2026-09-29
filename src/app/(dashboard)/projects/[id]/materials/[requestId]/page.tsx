import { notFound, redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getRequestById } from "@/lib/services/material-requests";
import RequestDetail from "./RequestDetail";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MaterialRequestPage({ params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  if (!UUID.test(id) || !UUID.test(requestId)) notFound();
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  const request = await getRequestById(requestId, id, c.companyId).catch(() => null);
  if (!request) notFound();
  const isReviewer = c.role === "owner" || c.role === "manager";
  return <RequestDetail request={request} projectId={id} canReview={isReviewer} canCancel={isReviewer || request.requested_by === c.userId} />;
}
