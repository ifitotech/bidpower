import { createClient } from "@/lib/supabase/server";
import { deriveMaterials, TAKEOFF_CATEGORIES, type TakeoffCircuit, type TakeoffFeeder, type TakeoffPanel } from "@/lib/takeoff";
import { createMaterialRequest } from "@/lib/services/material-requests";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export type TakeoffRow = { id: string; number: string; title: string; status: string; created_at: string; updated_at: string };

export async function getProjectTakeoffs(projectId: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("takeoffs").select("id, number, title, status, created_at, updated_at").eq("project_id", projectId).eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) throw error;
  return data as TakeoffRow[];
}

export type TakeoffFull = NonNullable<Awaited<ReturnType<typeof getTakeoff>>>;

export async function getTakeoff(id: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("takeoffs")
    .select("id, number, title, notes, waste_pct, status, verified_at, material_request_id, project_id, created_at, project:projects(id, name), verifier:profiles!takeoffs_verified_by_fkey(full_name)")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [counts, panels, feeders, docs] = await Promise.all([
    supabase.from("takeoff_counts").select("id, category, label, quantity, plan_ref, sort_order").eq("takeoff_id", id).order("sort_order").order("id"),
    supabase.from("takeoff_panels").select("id, name, voltage, phases, bus_amps, main_breaker_amps, location, sort_order, circuits:takeoff_circuits(id, circuit_no, description, breaker_amps, poles, sort_order)").eq("takeoff_id", id).order("sort_order").order("id"),
    supabase.from("takeoff_feeders").select("id, name, from_label, to_label, length_ft, conductor_size, conductors, ground_size, conduit_size, conduit_type, sort_order").eq("takeoff_id", id).order("sort_order").order("id"),
    supabase.from("documents").select("id, name, mime_type, size_bytes, created_at").eq("related_type", "takeoff").eq("related_id", id).order("created_at"),
  ]);
  for (const r of [counts, panels, feeders, docs]) if (r.error) throw r.error;
  const raw = data as unknown as { project?: unknown; verifier?: unknown } & Record<string, unknown>;
  return {
    ...(raw as { id: string; number: string; title: string; notes: string | null; waste_pct: number; status: string; verified_at: string | null; material_request_id: string | null; project_id: string; created_at: string }),
    waste_pct: Number(raw.waste_pct),
    project: one(raw.project as { id: string; name: string } | { id: string; name: string }[] | null),
    verifier: one(raw.verifier as { full_name: string | null } | { full_name: string | null }[] | null),
    counts: (counts.data ?? []).map((c) => ({ ...c, quantity: Number(c.quantity) })) as { id: string; category: string; label: string; quantity: number; plan_ref: string | null }[],
    panels: ((panels.data ?? []) as unknown as (Omit<TakeoffPanel, "circuits"> & { id: string; location: string | null; circuits: (TakeoffCircuit & { id: string; description: string | null; sort_order: number })[] })[]).map((p) => ({
      ...p, circuits: [...(p.circuits ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.circuit_no.localeCompare(b.circuit_no, undefined, { numeric: true })),
    })),
    feeders: (feeders.data ?? []).map((f) => ({ ...f, length_ft: Number(f.length_ft) })) as (TakeoffFeeder & { id: string; from_label: string | null; to_label: string | null })[],
    documents: (docs.data ?? []) as { id: string; name: string; mime_type: string; size_bytes: number; created_at: string }[],
  };
}

export async function createTakeoff(companyId: string, userId: string, input: { projectId: string; title: string; notes?: string | null }) {
  const supabase = await createClient();
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new Error("takeoff_title_required");
  const { data: number, error: numErr } = await supabase.rpc("next_takeoff_number", { p_company: companyId });
  if (numErr) throw numErr;
  const { data, error } = await supabase.from("takeoffs").insert({ company_id: companyId, project_id: input.projectId, number, title, notes: input.notes?.trim().slice(0, 2000) || null, created_by: userId }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateTakeoff(companyId: string, id: string, patch: { title?: string; notes?: string | null; waste_pct?: number }) {
  const supabase = await createClient();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) { const t = patch.title.trim().slice(0, 160); if (!t) throw new Error("takeoff_title_required"); upd.title = t; }
  if (patch.notes !== undefined) upd.notes = patch.notes?.trim().slice(0, 2000) || null;
  if (patch.waste_pct !== undefined) {
    if (!Number.isFinite(patch.waste_pct) || patch.waste_pct < 0 || patch.waste_pct > 100) throw new Error("takeoff_invalid");
    upd.waste_pct = Math.round(patch.waste_pct * 100) / 100;
    upd.status = "draft"; // changing the waste factor changes the list: needs verification again
  }
  const { data, error } = await supabase.from("takeoffs").update(upd).eq("id", id).eq("company_id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

export async function setTakeoffVerified(companyId: string, id: string, verified: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("takeoffs").update({ status: verified ? "verified" : "draft", updated_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

// ---- rows (counts, panels, circuits, feeders) ----

const str = (v: unknown, max: number) => { const s = String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max); return s || null; };
const numIn = (v: unknown) => { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
const posInt = (v: unknown, max = 100000) => { const n = Math.round(numIn(v)); return n > 0 && n <= max ? n : null; };

export type RowOp =
  | { kind: "count"; id?: string; takeoffId?: string; data?: Record<string, unknown>; remove?: boolean }
  | { kind: "panel"; id?: string; takeoffId?: string; data?: Record<string, unknown>; remove?: boolean }
  | { kind: "circuit"; id?: string; panelId?: string; data?: Record<string, unknown>; remove?: boolean }
  | { kind: "feeder"; id?: string; takeoffId?: string; data?: Record<string, unknown>; remove?: boolean };

const TABLE = { count: "takeoff_counts", panel: "takeoff_panels", circuit: "takeoff_circuits", feeder: "takeoff_feeders" } as const;

/** One entry point for add / edit / delete of the rows a person enters. Values are validated here and by CHECKs in the database. */
export async function mutateRow(companyId: string, op: RowOp) {
  const supabase = await createClient();
  const table = TABLE[op.kind];
  if (op.remove) {
    if (!op.id) throw new Error("takeoff_invalid");
    const { data, error } = await supabase.from(table).delete().eq("id", op.id).eq("company_id", companyId).select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("forbidden");
    return;
  }
  const d = op.data ?? {};
  let values: Record<string, unknown>;
  if (op.kind === "count") {
    const cat = String(d.category ?? "");
    const qty = numIn(d.quantity), label = str(d.label, 200);
    if (!TAKEOFF_CATEGORIES.some((c) => c.code === cat) || !label || !(qty > 0) || qty > 1_000_000) throw new Error("takeoff_invalid");
    values = { category: cat, label, quantity: Math.round(qty * 100) / 100, plan_ref: str(d.plan_ref, 120) };
  } else if (op.kind === "panel") {
    const name = str(d.name, 80);
    const phases = Number(d.phases) === 3 ? 3 : 1;
    if (!name) throw new Error("takeoff_invalid");
    values = { name, voltage: str(d.voltage, 40), phases, bus_amps: d.bus_amps ? posInt(d.bus_amps, 10000) : null, main_breaker_amps: d.main_breaker_amps ? posInt(d.main_breaker_amps, 10000) : null, location: str(d.location, 120) };
  } else if (op.kind === "circuit") {
    const no = str(d.circuit_no, 20), amps = posInt(d.breaker_amps, 4000), poles = Number(d.poles);
    if (!no || !amps || ![1, 2, 3].includes(poles)) throw new Error("takeoff_invalid");
    values = { circuit_no: no, description: str(d.description, 200), breaker_amps: amps, poles };
  } else {
    const name = str(d.name, 120), len = numIn(d.length_ft);
    if (!name || !(len > 0) || len > 1_000_000) throw new Error("takeoff_invalid");
    const conductors = d.conductors ? posInt(d.conductors, 12) : null;
    values = { name, from_label: str(d.from_label, 120), to_label: str(d.to_label, 120), length_ft: Math.round(len * 10) / 10, conductor_size: str(d.conductor_size, 40), conductors, ground_size: str(d.ground_size, 40), conduit_size: str(d.conduit_size, 40), conduit_type: str(d.conduit_type, 40) };
  }

  if (op.id) {
    const { data, error } = await supabase.from(table).update(values).eq("id", op.id).eq("company_id", companyId).select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("forbidden");
    return;
  }
  const parent = op.kind === "circuit" ? { panel_id: op.panelId } : { takeoff_id: (op as { takeoffId?: string }).takeoffId };
  if (!Object.values(parent)[0]) throw new Error("takeoff_invalid");
  const { error } = await supabase.from(table).insert({ company_id: companyId, ...parent, ...values });
  if (error) throw error;
}

// ---- plans ----

const ALLOWED_FILES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE = 25 * 1024 * 1024;

export async function addTakeoffPlan(companyId: string, userId: string, takeoffId: string, file: File) {
  if (!ALLOWED_FILES.includes(file.type)) throw new Error("file_type");
  if (file.size > MAX_FILE) throw new Error("file_size");
  const supabase = await createClient();
  const { data: tk, error: tkErr } = await supabase.from("takeoffs").select("id").eq("id", takeoffId).eq("company_id", companyId).maybeSingle();
  if (tkErr) throw tkErr;
  if (!tk) throw new Error("forbidden");
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  const path = `${companyId}/takeoff/${takeoffId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const { error } = await supabase.from("documents").insert({ company_id: companyId, uploaded_by: userId, name: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size, storage_path: path, related_type: "takeoff", related_id: takeoffId });
  if (error) {
    await supabase.storage.from("documents").remove([path]);
    throw error;
  }
}

export async function getTakeoffPlanUrl(companyId: string, documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("storage_path").eq("id", documentId).eq("company_id", companyId).eq("related_type", "takeoff").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("forbidden");
  const signed = await supabase.storage.from("documents").createSignedUrl(data.storage_path as string, 120);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}

// ---- hand-off ----

/**
 * The preliminary list becomes a Material Request (the normal flow: review -> Pricing Request -> PO).
 * Lines are free text (never library items) and the note says the numbers are PRELIMINARY.
 */
export async function takeoffToMaterialRequest(companyId: string, userId: string, id: string) {
  const tk = await getTakeoff(id, companyId);
  if (!tk) throw new Error("forbidden");
  const { lines } = deriveMaterials({ counts: tk.counts, panels: tk.panels, feeders: tk.feeders, wastePct: tk.waste_pct });
  if (lines.length === 0) throw new Error("takeoff_empty");
  const result = await createMaterialRequest(companyId, userId, {
    projectId: tk.project_id,
    notes: `PRELIMINARY takeoff ${tk.number}${tk.status === "verified" ? " (verified)" : " (not verified)"} — verify with the contractor/supply before ordering.`,
    lines: lines.map((l) => ({ materialId: null, description: l.description, quantity: l.quantity, unit: l.unit, category: l.category, notes: `takeoff: ${l.basis}`.slice(0, 480), allowSubstitution: false })),
  });
  const supabase = await createClient();
  await supabase.from("takeoffs").update({ material_request_id: result.id }).eq("id", id).eq("company_id", companyId);
  return result;
}
