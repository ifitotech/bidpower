import { createClient } from "@/lib/supabase/server";

export type TeamPO = { id: string; number: string; vendor: string; status: string; amount: number | null; project: string | null; who: string | null; at: string };
export type OverdueReceipts = { who: string; count: number; days: number };

const RECEIPT_GRACE_DAYS = 2;

/** What the team bought lately and who still owes a receipt. For owners and managers; amounts only with cost permission. */
export async function getTeamPurchases(ctx: { companyId: string; userId: string; canCosts: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchase_orders")
    .select("id, number, vendor_name, status, estimated_amount, final_amount, created_at, created_by, creator:profiles!purchase_orders_created_by_fkey(full_name), project:projects(name)")
    .eq("company_id", ctx.companyId).neq("status", "cancelled").order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as { full_name?: string; name?: string } | null;
  const rows = (data ?? []).map((r) => ({
    id: r.id as string, number: r.number as string, vendor: r.vendor_name as string, status: r.status as string,
    amount: ctx.canCosts ? ((r.final_amount ?? r.estimated_amount) as number | null) : null,
    project: one(r.project)?.name ?? null, who: one(r.creator)?.full_name ?? null, at: r.created_at as string, by: r.created_by as string,
  }));
  const recent: TeamPO[] = rows.filter((r) => r.by !== ctx.userId).slice(0, 8).map(({ by: _by, ...po }) => po);
  const overdueMap = new Map<string, OverdueReceipts>();
  const now = Date.now();
  for (const r of rows) {
    if (r.by === ctx.userId || (r.status !== "pending_document" && r.status !== "received")) continue;
    const days = Math.floor((now - new Date(r.at).getTime()) / 86400000);
    if (days < RECEIPT_GRACE_DAYS) continue;
    const cur = overdueMap.get(r.by) ?? { who: r.who ?? "—", count: 0, days: 0 };
    cur.count += 1; cur.days = Math.max(cur.days, days);
    overdueMap.set(r.by, cur);
  }
  return { recent, overdue: [...overdueMap.values()].sort((a, b) => b.days - a.days) };
}
