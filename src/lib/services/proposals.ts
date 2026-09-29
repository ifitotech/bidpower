import { createClient } from "@/lib/supabase/server";


export type LinkView = { id: string; recipient_name: string | null; expires_at: string; revoked_at: string | null; last_used_at: string | null; created_at: string };
export type ActionView = { id: string; action: string; customer_name: string | null; message: string | null; ip: string | null; created_at: string };
export type ChangeRequestView = { id: string; message: string; requested_by_name: string | null; status: string; created_at: string };
export type ChangeOrderView = {
  id: string; number: string; title: string; description: string | null; status: string; total: number; approved_by_name: string | null; approved_at: string | null;
  items: { id: string; description: string; quantity: number; unit_price: number; amount: number }[]; links: LinkView[];
};
export type VersionView = { id: string; version: number; status: string; total: number };

/** Everything the Proposal screen needs besides the quote itself. RLS decides what each person can read. */
export async function getProposalExtras(quoteId: string, companyId: string, number: string) {
  const supabase = await createClient();
  const [versions, links, actions, requests, orders] = await Promise.all([
    supabase.from("quotes").select("id, version, status, total").eq("company_id", companyId).eq("number", number).order("version"),
    supabase.from("customer_links").select("id, recipient_name, expires_at, revoked_at, last_used_at, created_at").eq("company_id", companyId).eq("object_type", "proposal").eq("object_id", quoteId).order("created_at", { ascending: false }),
    supabase.from("customer_actions").select("id, action, customer_name, message, ip, created_at, object_type, object_id").eq("company_id", companyId).eq("object_id", quoteId).order("created_at", { ascending: false }).limit(30),
    supabase.from("change_requests").select("id, message, requested_by_name, status, created_at").eq("company_id", companyId).eq("quote_id", quoteId).order("created_at", { ascending: false }),
    supabase.from("change_orders").select("id, number, title, description, status, total, approved_by_name, approved_at, items:change_order_items(id, description, quantity, unit_price, amount, sort_order)").eq("company_id", companyId).eq("quote_id", quoteId).order("created_at"),
  ]);
  for (const r of [versions, links, actions, requests, orders]) if (r.error) throw r.error;

  const orderIds = (orders.data ?? []).map((o) => o.id as string);
  const coLinks = orderIds.length
    ? await supabase.from("customer_links").select("id, object_id, recipient_name, expires_at, revoked_at, last_used_at, created_at").eq("company_id", companyId).eq("object_type", "change_order").in("object_id", orderIds).order("created_at", { ascending: false })
    : { data: [] as { id: string; object_id: string; recipient_name: string | null; expires_at: string; revoked_at: string | null; last_used_at: string | null; created_at: string }[], error: null };
  if (coLinks.error) throw coLinks.error;

  const coActions = orderIds.length
    ? await supabase.from("customer_actions").select("id, action, customer_name, message, ip, created_at, object_id").eq("company_id", companyId).eq("object_type", "change_order").in("object_id", orderIds).order("created_at", { ascending: false })
    : { data: [] as ActionView[] & { object_id: string }[], error: null };

  return {
    versions: (versions.data ?? []).map((v) => ({ ...v, total: Number(v.total) })) as VersionView[],
    links: (links.data ?? []) as LinkView[],
    actions: ((actions.data ?? []) as (ActionView & { object_type: string })[]).filter((a) => a.object_type === "proposal") as ActionView[],
    changeRequests: (requests.data ?? []) as ChangeRequestView[],
    changeOrders: (orders.data ?? []).map((o) => ({
      id: o.id as string, number: o.number as string, title: o.title as string, description: o.description as string | null, status: o.status as string,
      total: Number(o.total), approved_by_name: o.approved_by_name as string | null, approved_at: o.approved_at as string | null,
      items: [...((o.items ?? []) as { id: string; description: string; quantity: number; unit_price: number; amount: number; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), amount: Number(i.amount) })),
      links: (coLinks.data ?? []).filter((l) => l.object_id === o.id) as LinkView[],
      actions: ((coActions.data ?? []) as unknown as (ActionView & { object_id: string })[]).filter((a) => a.object_id === o.id),
    })) as (ChangeOrderView & { actions: ActionView[] })[],
  };
}

/**
 * One link per recipient and document. Only the sha256 of the token is stored, so the link is shown once.
 * Creating the first link from a draft is "sending": the document moves to `sent`, waiting on the customer.
 */
export async function createCustomerLink(companyId: string, userId: string, input: { objectType: "proposal" | "change_order"; objectId: string; recipientName: string; recipientEmail?: string | null; days?: number }) {
  const supabase = await createClient();
  const table = input.objectType === "proposal" ? "quotes" : "change_orders";
  const { data: obj, error } = await supabase.from(table).select("id, status, project_id").eq("id", input.objectId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!obj) throw new Error("forbidden");
  const okStatuses = input.objectType === "proposal" ? ["draft", "sent", "pending", "approved"] : ["draft", "sent"];
  if (!okStatuses.includes(obj.status as string)) throw new Error("not_open");

  const { randomBytes, createHash } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const days = Math.min(90, Math.max(1, Math.round(input.days ?? 30)));
  const { error: insErr } = await supabase.from("customer_links").insert({
    company_id: companyId, project_id: obj.project_id, object_type: input.objectType, object_id: input.objectId, created_by: userId,
    recipient_name: input.recipientName.trim().slice(0, 120) || null, recipient_email: input.recipientEmail?.trim().slice(0, 200) || null,
    token_hash: createHash("sha256").update(token).digest("hex"), scope: "approve", expires_at: new Date(Date.now() + days * 86400000).toISOString(),
  });
  if (insErr) throw insErr;

  if (obj.status === "draft") {
    const now = new Date().toISOString();
    const { data: moved, error: mvErr } = await supabase.from(table).update({ status: "sent", waiting_on: "customer", sent_at: now, updated_at: now }).eq("id", input.objectId).eq("company_id", companyId).eq("status", "draft").select("id");
    if (mvErr) throw mvErr;
    if (moved && moved.length && input.objectType === "proposal") {
      await supabase.from("quote_status_history").insert({ quote_id: input.objectId, from_status: "draft", to_status: "sent", changed_by: userId, notes: "secure link" });
    }
  }
  return token;
}

export async function revokeCustomerLink(companyId: string, linkId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("customer_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId).eq("company_id", companyId).is("revoked_at", null).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

export async function newProposalVersion(quoteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("new_proposal_version", { p_quote: quoteId });
  if (error) throw error;
  return data as string;
}

export type ChangeOrderInput = { quoteId: string; changeRequestId?: string | null; title: string; description?: string | null; lines: { description: string; quantity: number; unitPrice: number }[] };

export async function createChangeOrder(companyId: string, userId: string, input: ChangeOrderInput) {
  const supabase = await createClient();
  const lines = input.lines.filter((l) => l.description.trim() && Number.isFinite(l.quantity) && l.quantity > 0 && Number.isFinite(l.unitPrice));
  if (lines.length === 0) throw new Error("co_lines_required");
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new Error("co_lines_required");

  const { data: q, error: qErr } = await supabase.from("quotes").select("id, project_id, status").eq("id", input.quoteId).eq("company_id", companyId).maybeSingle();
  if (qErr) throw qErr;
  if (!q || !q.project_id) throw new Error("forbidden");
  if (q.status !== "approved") throw new Error("not_open");

  const rounded = lines.map((l) => ({ description: l.description.trim().slice(0, 300), quantity: l.quantity, unit_price: Math.round(l.unitPrice * 100) / 100, amount: Math.round(l.quantity * l.unitPrice * 100) / 100 }));
  const total = Math.round(rounded.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const { data: number, error: numErr } = await supabase.rpc("next_change_order_number", { p_company: companyId });
  if (numErr) throw numErr;

  const { data: co, error } = await supabase.from("change_orders").insert({
    company_id: companyId, project_id: q.project_id, quote_id: input.quoteId, change_request_id: input.changeRequestId ?? null, number, title,
    description: input.description?.trim().slice(0, 2000) || null, status: "draft", waiting_on: "owner", total, created_by: userId,
  }).select("id, number").single();
  if (error) throw error;
  const { error: itemErr } = await supabase.from("change_order_items").insert(rounded.map((l, idx) => ({ company_id: companyId, change_order_id: co.id, ...l, sort_order: idx })));
  if (itemErr) {
    await supabase.from("change_orders").delete().eq("id", co.id);
    throw itemErr;
  }
  if (input.changeRequestId) {
    await supabase.from("change_requests").update({ status: "converted_to_change_order", waiting_on: "customer", resolved_at: new Date().toISOString() }).eq("id", input.changeRequestId).eq("company_id", companyId).eq("status", "open");
  }
  return { id: co.id as string, number: co.number as string };
}

export async function cancelChangeOrder(companyId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("change_orders").update({ status: "cancelled", waiting_on: "none", updated_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId).in("status", ["draft", "sent"]).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not_open");
  await supabase.from("customer_links").update({ revoked_at: new Date().toISOString() }).eq("company_id", companyId).eq("object_type", "change_order").eq("object_id", id).is("revoked_at", null);
}

export async function declineChangeRequest(companyId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("change_requests").update({ status: "declined", waiting_on: "none", resolved_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId).eq("status", "open").select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not_open");
}

/** Home "needs attention": open change requests (a customer asked for a change, waiting on the owner). */
export async function countCustomerAttention(companyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}
