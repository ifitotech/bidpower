import { createClient } from "@/lib/supabase/server";

export type MyPO = { id: string; number: string; vendor_name: string; status: string; estimated_amount: number | null; project: string | null; created_at: string };
export type MyRequest = { id: string; number: string; status: string; project_id: string; project: string | null; created_at: string };

/** What a field employee sees on their own home: only their own requests and purchases (RLS also limits the rows). */
export async function getEmployeeHome(ctx: { userId: string; companyId: string }) {
  const supabase = await createClient();
  const [pos, reqs, pending] = await Promise.all([
    supabase.from("purchase_orders").select("id, number, vendor_name, status, estimated_amount, created_at, project:projects(name)")
      .eq("company_id", ctx.companyId).eq("created_by", ctx.userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("material_requests").select("id, number, status, project_id, created_at, project:projects(name)")
      .eq("company_id", ctx.companyId).eq("requested_by", ctx.userId).order("created_at", { ascending: false }).limit(8),
    supabase.from("purchase_orders").select("id, number, vendor_name, status, estimated_amount, created_at, project:projects(name)")
      .eq("company_id", ctx.companyId).eq("created_by", ctx.userId).in("status", ["pending_document", "received"]).order("created_at", { ascending: true }).limit(20),
  ]);
  const name = (p: unknown) => (Array.isArray(p) ? (p[0] as { name?: string })?.name : (p as { name?: string } | null)?.name) ?? null;
  const toPO = (r: Record<string, unknown>): MyPO => ({ id: r.id as string, number: r.number as string, vendor_name: r.vendor_name as string, status: r.status as string, estimated_amount: r.estimated_amount as number | null, project: name(r.project), created_at: r.created_at as string });
  const myPOs: MyPO[] = (pos.data ?? []).map(toPO);
  const myRequests: MyRequest[] = (reqs.data ?? []).map((r) => ({ id: r.id as string, number: r.number as string, status: r.status as string, project_id: r.project_id as string, project: name(r.project), created_at: r.created_at as string }));
  const pendingReceipts: MyPO[] = (pending.data ?? []).map(toPO);
  return { myPOs, myRequests, pendingReceipts };
}
