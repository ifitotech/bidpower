import { createClient } from "@/lib/supabase/server";
import { CATEGORY_CODES, mergeLines, normalizeUnit, type RequestLineInput } from "@/lib/materials";

const REQUESTER = "requester:profiles!material_requests_requested_by_fkey(full_name)";

export type RequestRow = {
  id: string; number: string; status: string; waiting_on: string; needed_by: string | null; notes: string | null;
  review_note: string | null; created_at: string; project_id: string;
  requester?: { full_name?: string | null } | null; project?: { id: string; name: string } | null;
  itemCount: number;
};

type RawRequest = Omit<RequestRow, "itemCount" | "requester" | "project"> & {
  requester?: { full_name?: string | null } | { full_name?: string | null }[] | null;
  project?: { id: string; name: string } | { id: string; name: string }[] | null;
  items?: { count: number }[] | null;
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
const shape = (r: RawRequest): RequestRow => ({
  ...r, requester: one(r.requester), project: one(r.project), itemCount: r.items?.[0]?.count ?? 0,
});

export async function getProjectRequests(projectId: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_requests")
    .select(`id, number, status, waiting_on, needed_by, notes, review_note, created_at, project_id, ${REQUESTER}, items:material_request_items(count)`)
    .eq("company_id", companyId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RawRequest[]).map(shape);
}

/** All requests of the company (owners/managers), optionally only those waiting for review. */
export async function getCompanyRequests(companyId: string, onlyStatus?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("material_requests")
    .select(`id, number, status, waiting_on, needed_by, notes, review_note, created_at, project_id, ${REQUESTER}, project:projects(id, name), items:material_request_items(count)`)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (onlyStatus) query = query.eq("status", onlyStatus);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as RawRequest[]).map(shape);
}

export async function countPendingRequests(companyId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("material_requests")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "requested");
  if (error) throw error;
  return count ?? 0;
}

export type RequestItemRow = {
  id: string; material_id: string | null; description: string; quantity: number; unit: string; category: string | null;
  notes: string | null; allow_substitution: boolean; sort_order: number;
};

export async function getRequestById(requestId: string, projectId: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_requests")
    .select(`id, number, status, waiting_on, needed_by, notes, review_note, created_at, project_id, requested_by, reviewed_at, ${REQUESTER}, project:projects(id, name), items:material_request_items(id, material_id, description, quantity, unit, category, notes, allow_substitution, sort_order)`)
    .eq("id", requestId)
    .eq("project_id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const raw = data as unknown as RawRequest & { requested_by: string; reviewed_at: string | null; items: RequestItemRow[] };
  const items = [...(raw.items ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ ...i, quantity: Number(i.quantity) }));
  return {
    id: raw.id, number: raw.number, status: raw.status, waiting_on: raw.waiting_on, needed_by: raw.needed_by, notes: raw.notes,
    review_note: raw.review_note, created_at: raw.created_at, reviewed_at: raw.reviewed_at, requested_by: raw.requested_by,
    requester: one(raw.requester), project: one(raw.project), items,
  };
}

/**
 * Creates the request for a project the caller can see, then its lines, then bumps "recently used" on library items.
 * If the lines fail, the request is cancelled so nothing half-created stays waiting on the owner.
 */
export async function createMaterialRequest(
  companyId: string,
  userId: string,
  input: { projectId: string; neededBy?: string | null; notes?: string | null; lines: RequestLineInput[] }
) {
  const lines = mergeLines(input.lines.filter((l) => l.description.trim() && l.quantity > 0));
  if (lines.length === 0) throw new Error("request_empty");
  if (lines.length > 300) throw new Error("request_too_large");

  const supabase = await createClient();
  const { data: number, error: numError } = await supabase.rpc("next_material_request_number", { p_company: companyId });
  if (numError) throw numError;

  const { data: request, error } = await supabase
    .from("material_requests")
    .insert({
      company_id: companyId, project_id: input.projectId, requested_by: userId, number,
      needed_by: input.neededBy || null, notes: input.notes?.trim() || null,
      status: "requested", waiting_on: "owner",
    })
    .select("id, number")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("material_request_items").insert(
    lines.map((l, idx) => ({
      company_id: companyId, request_id: request.id, material_id: l.materialId,
      description: l.description.trim().slice(0, 300), quantity: l.quantity, unit: normalizeUnit(l.unit),
      category: l.category && CATEGORY_CODES.includes(l.category) ? l.category : null,
      notes: l.notes?.trim() || null, allow_substitution: l.allowSubstitution, sort_order: idx,
    }))
  );
  if (itemsError) {
    await supabase.from("material_requests").update({ status: "cancelled", waiting_on: "none" }).eq("id", request.id);
    throw itemsError;
  }

  const ids = lines.map((l) => l.materialId).filter((id): id is string => Boolean(id));
  if (ids.length) await supabase.rpc("record_material_use", { p_material_ids: ids });
  return { id: request.id as string, number: request.number as string };
}

/** Owner/manager decision. "reviewed" needs nothing more from the requester; "rejected" goes back to the employee. */
export async function reviewMaterialRequest(companyId: string, userId: string, requestId: string, decision: "reviewed" | "rejected", note?: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_requests")
    .update({
      status: decision, waiting_on: decision === "rejected" ? "employee" : "none",
      review_note: note?.trim() || null, reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("company_id", companyId)
    .eq("status", "requested")
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("request_not_pending");
}

export async function cancelMaterialRequest(companyId: string, requestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_requests")
    .update({ status: "cancelled", waiting_on: "none", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("company_id", companyId)
    .eq("status", "requested")
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("request_not_pending");
}

/** Project id + name if the caller can see it (RLS decides), else null. */
export async function getProjectBasic(projectId: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("id, name").eq("id", projectId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  return data as { id: string; name: string } | null;
}
