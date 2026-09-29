import { createClient } from "@/lib/supabase/server";
import { CATEGORY_CODES, normalizeUnit } from "@/lib/materials";
import { AVAILABILITY, PRICING_TYPE_CODES, cleanLinks, responseTotal, round2, type PricingLink, type ResponseLine } from "@/lib/pricing";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export type PricingRow = {
  id: string; number: string | null; title: string | null; request_type: string; status: string; waiting_on: string;
  response_due_date: string | null; created_at: string; project_id: string | null;
  project?: { id: string; name: string } | null; itemCount: number; responseCount: number;
};

type RawRow = Omit<PricingRow, "project" | "itemCount" | "responseCount"> & {
  project?: { id: string; name: string } | { id: string; name: string }[] | null;
  items?: { count: number }[] | null; responses?: { count: number }[] | null;
};

const LIST_SELECT = "id, number, title, request_type, status, waiting_on, response_due_date, created_at, project_id, project:projects(id, name), items:supply_quote_request_items(count), responses:supplier_quote_responses(count)";

const shape = (r: RawRow): PricingRow => ({ ...r, project: one(r.project), itemCount: r.items?.[0]?.count ?? 0, responseCount: r.responses?.[0]?.count ?? 0 });

export async function getPricingRequests(companyId: string, projectId?: string) {
  const supabase = await createClient();
  let q = supabase.from("supply_quote_requests").select(LIST_SELECT).eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as RawRow[]).map(shape);
}

/** Open requests whose Bid Date is today or earlier than `days` from now (for Needs Attention later). */
export async function countAwaitingPricing(companyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase.from("supply_quote_requests").select("id", { count: "exact", head: true })
    .eq("company_id", companyId).eq("status", "responded");
  if (error) throw error;
  return count ?? 0;
}

export type PricingItem = {
  id: string; material_id: string | null; description: string; quantity: number; unit: string; category: string | null;
  manufacturer: string | null; catalog_number: string | null; notes: string | null; allow_substitution: boolean; sort_order: number;
};
export type ResponseView = {
  id: string; supplier_name: string | null; supplier_id: string | null; quote_number: string | null; total_amount: number | null;
  freight: number | null; tax_amount: number | null; expires_on: string | null; notes: string | null; status: string; source: string; created_at: string;
  lines: { requestItemId: string; unitPrice: number | null; availability: string | null; leadTime: string | null; notes: string | null }[];
};
export type AttachmentView = { id: string; name: string; mime_type: string; size_bytes: number; storage_path: string; response_id: string | null };

/** Full detail. `pricesVisible` is false for people without view-costs: RLS already returns no responses for them. */
export async function getPricingRequestById(id: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supply_quote_requests")
    .select("id, number, title, request_type, status, waiting_on, response_due_date, delivery_method, delivery_address, notes, links, created_at, created_by, project_id, material_request_id, sent_at, project:projects(id, name), material_request:material_requests(id, number, project_id)")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [items, responses, attachments] = await Promise.all([
    supabase.from("supply_quote_request_items").select("id, material_id, description, quantity, unit, category, manufacturer, catalog_number, notes, allow_substitution, sort_order").eq("request_id", id).order("sort_order"),
    supabase.from("supplier_quote_responses").select("id, supplier_name, supplier_id, quote_number, total_amount, freight, tax_amount, expires_on, notes, status, source, created_at, items:supplier_quote_response_items(request_item_id, unit_price, availability, lead_time, notes)").eq("request_id", id).order("created_at"),
    supabase.from("supplier_quote_attachments").select("id, name, mime_type, size_bytes, storage_path, response_id").eq("request_id", id).order("created_at"),
  ]);
  if (items.error) throw items.error;
  if (responses.error) throw responses.error;
  if (attachments.error) throw attachments.error;
  type RawResp = Omit<ResponseView, "lines"> & { items: { request_item_id: string; unit_price: number | null; availability: string | null; lead_time: string | null; notes: string | null }[] };
  const raw = data as unknown as Record<string, unknown> & { project?: unknown; material_request?: unknown; links: unknown };
  return {
    ...(raw as Record<string, unknown>),
    project: one(raw.project as { id: string; name: string } | { id: string; name: string }[] | null),
    material_request: one(raw.material_request as { id: string; number: string; project_id: string } | { id: string; number: string; project_id: string }[] | null),
    links: cleanLinks(raw.links),
    items: (items.data as unknown as PricingItem[]).map((i) => ({ ...i, quantity: Number(i.quantity) })),
    responses: (responses.data as unknown as RawResp[]).map((r): ResponseView => ({
      id: r.id, supplier_name: r.supplier_name, supplier_id: r.supplier_id, quote_number: r.quote_number,
      total_amount: r.total_amount == null ? null : Number(r.total_amount), freight: r.freight == null ? null : Number(r.freight),
      tax_amount: r.tax_amount == null ? null : Number(r.tax_amount), expires_on: r.expires_on, notes: r.notes, status: r.status, source: r.source, created_at: r.created_at,
      lines: (r.items ?? []).map((l) => ({ requestItemId: l.request_item_id, unitPrice: l.unit_price == null ? null : Number(l.unit_price), availability: l.availability, leadTime: l.lead_time, notes: l.notes })),
    })),
    attachments: attachments.data as unknown as AttachmentView[],
  } as {
    id: string; number: string | null; title: string | null; request_type: string; status: string; waiting_on: string; response_due_date: string | null;
    delivery_method: string | null; delivery_address: string | null; notes: string | null; links: PricingLink[]; created_at: string; created_by: string;
    project_id: string | null; material_request_id: string | null; sent_at: string | null;
    project: { id: string; name: string } | null; material_request: { id: string; number: string; project_id: string } | null;
    items: PricingItem[]; responses: ResponseView[]; attachments: AttachmentView[];
  };
}

export type PricingLineInput = { materialId?: string | null; description: string; quantity: number; unit?: string; category?: string | null; manufacturer?: string | null; catalogNumber?: string | null; notes?: string | null; allowSubstitution?: boolean };
export type PricingInput = {
  projectId: string | null; requestType: string; title?: string | null; bidDate?: string | null; notes?: string | null;
  deliveryMethod?: string | null; deliveryAddress?: string | null; links?: unknown; materialRequestId?: string | null; lines: PricingLineInput[];
};

const clean = (v: string | null | undefined, max = 500) => (v && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Creates a draft Pricing Request with its lines. When it comes from a Material Request the lines are copied
 * from that request (never re-typed) and the source keeps a link. If the lines fail, the request is removed.
 */
export async function createPricingRequest(companyId: string, userId: string, input: PricingInput) {
  const supabase = await createClient();
  let lines = input.lines;
  let projectId = input.projectId;
  if (input.materialRequestId) {
    const { data: mr, error: mrErr } = await supabase
      .from("material_requests")
      .select("id, project_id, status, items:material_request_items(material_id, description, quantity, unit, category, manufacturer, catalog_number, allow_substitution, notes, sort_order)")
      .eq("id", input.materialRequestId).eq("company_id", companyId).maybeSingle();
    if (mrErr) throw mrErr;
    if (!mr) throw new Error("forbidden");
    projectId = projectId ?? (mr.project_id as string);
    lines = [...(mr.items as { material_id: string | null; description: string; quantity: number; unit: string; category: string | null; manufacturer: string | null; catalog_number: string | null; allow_substitution: boolean; notes: string | null; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ materialId: i.material_id, description: i.description, quantity: Number(i.quantity), unit: i.unit, category: i.category, manufacturer: i.manufacturer, catalogNumber: i.catalog_number, notes: i.notes, allowSubstitution: i.allow_substitution }));
  }
  const valid = lines.filter((l) => l.description?.trim() && l.quantity > 0);
  if (valid.length === 0) throw new Error("request_empty");
  if (valid.length > 300) throw new Error("request_too_large");

  const { data: number, error: numErr } = await supabase.rpc("next_pricing_request_number", { p_company: companyId });
  if (numErr) throw numErr;
  const { data: req, error } = await supabase.from("supply_quote_requests").insert({
    company_id: companyId, created_by: userId, project_id: projectId, number,
    request_type: PRICING_TYPE_CODES.includes(input.requestType) ? input.requestType : "material",
    title: clean(input.title, 120), response_due_date: input.bidDate || null, notes: clean(input.notes, 2000),
    delivery_method: input.deliveryMethod === "delivery" || input.deliveryMethod === "pickup" ? input.deliveryMethod : null,
    delivery_address: clean(input.deliveryAddress, 300), links: cleanLinks(input.links),
    material_request_id: input.materialRequestId ?? null, status: "draft", waiting_on: "owner",
  }).select("id, number").single();
  if (error) throw error;

  const { error: itemsErr } = await supabase.from("supply_quote_request_items").insert(valid.map((l, idx) => ({
    company_id: companyId, request_id: req.id, material_id: l.materialId ?? null, description: l.description.trim().slice(0, 300),
    quantity: l.quantity, unit: normalizeUnit(l.unit), category: l.category && CATEGORY_CODES.includes(l.category) ? l.category : null,
    manufacturer: clean(l.manufacturer, 120), catalog_number: clean(l.catalogNumber, 120), notes: clean(l.notes), allow_substitution: Boolean(l.allowSubstitution), sort_order: idx,
  })));
  if (itemsErr) {
    await supabase.from("supply_quote_requests").delete().eq("id", req.id);
    throw itemsErr;
  }
  return { id: req.id as string, number: req.number as string };
}

/** Owner/manager: the Material Request that fed a Pricing Request moves on (handoff), waiting on the supplier. */
export async function markMaterialRequestConverted(companyId: string, materialRequestId: string) {
  const supabase = await createClient();
  await supabase.from("material_requests").update({ status: "converted", waiting_on: "supplier", updated_at: new Date().toISOString() })
    .eq("id", materialRequestId).eq("company_id", companyId).in("status", ["requested", "reviewed"]);
}

async function transition(companyId: string, id: string, from: string[], patch: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("supply_quote_requests").update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId).in("status", from).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("request_not_pending");
}

/** There is no email provider yet: "sent" is recorded when the person shares it with the supplier themselves. */
export const markPricingSent = (companyId: string, id: string) => transition(companyId, id, ["draft"], { status: "sent", waiting_on: "supplier", sent_at: new Date().toISOString() });
export const closePricingRequest = (companyId: string, id: string) => transition(companyId, id, ["draft", "sent", "question_open", "responded"], { status: "closed", waiting_on: "none" });
export const cancelPricingRequest = (companyId: string, id: string) => transition(companyId, id, ["draft", "sent", "question_open", "responded"], { status: "cancelled", waiting_on: "none" });

export type ResponseInput = {
  supplierId?: string | null; supplierName: string; quoteNumber?: string | null; totalAmount?: number | null; freight?: number | null;
  taxAmount?: number | null; expiresOn?: string | null; notes?: string | null; lines: { requestItemId: string; unitPrice?: number | null; availability?: string | null; leadTime?: string | null; notes?: string | null }[];
};

/** Owner/manager records what a supplier answered (phone, email or PDF). Lines are matched to the request's own lines. */
export async function recordSupplierResponse(companyId: string, userId: string, requestId: string, input: ResponseInput) {
  const supabase = await createClient();
  const name = input.supplierName.trim().slice(0, 120);
  if (!name) throw new Error("supplier_required");
  const { data: items, error: itemsErr } = await supabase.from("supply_quote_request_items").select("id, quantity").eq("request_id", requestId).eq("company_id", companyId);
  if (itemsErr) throw itemsErr;
  const qty = new Map((items ?? []).map((i) => [i.id as string, Number(i.quantity)]));
  if (qty.size === 0) throw new Error("forbidden");

  const money = (v: number | null | undefined) => (v == null || !Number.isFinite(v) || v < 0 ? null : round2(v));
  const lines: ResponseLine[] = [];
  for (const l of input.lines) {
    const q = qty.get(l.requestItemId);
    if (q == null) continue;
    const price = money(l.unitPrice);
    const availability = l.availability && (AVAILABILITY as readonly string[]).includes(l.availability) ? (l.availability as ResponseLine["availability"]) : price != null ? "available" : null;
    if (price == null && !availability && !l.leadTime?.trim() && !l.notes?.trim()) continue;
    lines.push({ requestItemId: l.requestItemId, quantity: q, unitPrice: price, availability, leadTime: clean(l.leadTime, 80) });
  }
  if (lines.length === 0 && money(input.totalAmount) == null) throw new Error("response_empty");
  const freight = money(input.freight), tax = money(input.taxAmount);

  const { data: resp, error } = await supabase.from("supplier_quote_responses").insert({
    company_id: companyId, request_id: requestId, supplier_id: input.supplierId ?? null, supplier_name: name,
    quote_number: clean(input.quoteNumber, 60), total_amount: responseTotal(lines, freight, tax, money(input.totalAmount)), freight, tax_amount: tax,
    expires_on: input.expiresOn || null, notes: clean(input.notes, 2000), status: "submitted", source: "manual", entered_by: userId, submitted_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;

  if (lines.length) {
    const noteByItem = new Map(input.lines.map((l) => [l.requestItemId, clean(l.notes)]));
    const { error: lineErr } = await supabase.from("supplier_quote_response_items").insert(lines.map((l) => ({
      company_id: companyId, response_id: resp.id, request_item_id: l.requestItemId, unit_price: l.unitPrice, availability: l.availability,
      lead_time: l.leadTime, notes: noteByItem.get(l.requestItemId) ?? null,
    })));
    if (lineErr) {
      await supabase.from("supplier_quote_responses").delete().eq("id", resp.id);
      throw lineErr;
    }
  }
  await supabase.from("supply_quote_requests").update({ status: "responded", waiting_on: "owner", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", requestId).eq("company_id", companyId).in("status", ["draft", "sent", "question_open", "responded"]);
  return resp.id as string;
}

/** Award: the chosen response is accepted, the others declined, the request waits on nobody (PO comes in Phase 5). */
export async function awardResponse(companyId: string, requestId: string, responseId: string) {
  const supabase = await createClient();
  const { data: resp, error } = await supabase.from("supplier_quote_responses").select("id").eq("id", responseId).eq("request_id", requestId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!resp) throw new Error("forbidden");
  await transition(companyId, requestId, ["responded", "sent", "draft", "question_open"], { status: "awarded", waiting_on: "none" });
  const a = await supabase.from("supplier_quote_responses").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", responseId).eq("company_id", companyId);
  if (a.error) throw a.error;
  const d = await supabase.from("supplier_quote_responses").update({ status: "declined", updated_at: new Date().toISOString() }).eq("request_id", requestId).eq("company_id", companyId).neq("id", responseId).eq("status", "submitted");
  if (d.error) throw d.error;
}

const ALLOWED_FILES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE = 10 * 1024 * 1024;

/** Plans, specs or a supplier's quote PDF, stored privately under the company folder. */
export async function addPricingAttachment(companyId: string, userId: string, requestId: string, file: File, responseId?: string | null) {
  if (!ALLOWED_FILES.includes(file.type)) throw new Error("file_type");
  if (file.size > MAX_FILE) throw new Error("file_size");
  const supabase = await createClient();
  const { data: req, error: reqErr } = await supabase.from("supply_quote_requests").select("id").eq("id", requestId).eq("company_id", companyId).maybeSingle();
  if (reqErr) throw reqErr;
  if (!req) throw new Error("forbidden");
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  const path = `${companyId}/pricing/${requestId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const { error } = await supabase.from("supplier_quote_attachments").insert({
    company_id: companyId, request_id: requestId, response_id: responseId ?? null, uploaded_by: userId,
    name: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size, storage_path: path,
  });
  if (error) {
    await supabase.storage.from("documents").remove([path]);
    throw error;
  }
}

/** Short-lived link for a file that belongs to a request the caller can already see. */
export async function getAttachmentUrl(companyId: string, attachmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("supplier_quote_attachments").select("storage_path").eq("id", attachmentId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("forbidden");
  const signed = await supabase.storage.from("documents").createSignedUrl(data.storage_path as string, 120);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}

export async function getSuppliers(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").select("id, name").eq("company_id", companyId).eq("is_active", true).order("name");
  if (error) throw error;
  return data as { id: string; name: string }[];
}

export async function createSupplier(companyId: string, userId: string, name: string) {
  const supabase = await createClient();
  const n = name.trim().slice(0, 120);
  if (!n) throw new Error("supplier_required");
  const { data, error } = await supabase.from("suppliers").insert({ company_id: companyId, created_by: userId, name: n }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

/** Reviewed Material Requests that can still become a Pricing Request. */
export async function getConvertibleMaterialRequests(companyId: string, projectId?: string) {
  const supabase = await createClient();
  let q = supabase.from("material_requests").select("id, number, project_id, status, project:projects(name), items:material_request_items(count)")
    .eq("company_id", companyId).in("status", ["requested", "reviewed"]).order("created_at", { ascending: false }).limit(50);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as { id: string; number: string; project_id: string; status: string; project?: { name: string } | { name: string }[] | null; items?: { count: number }[] }[]).map((r) => ({
    id: r.id, number: r.number, projectId: r.project_id, status: r.status, projectName: one(r.project)?.name ?? "", itemCount: r.items?.[0]?.count ?? 0,
  }));
}
