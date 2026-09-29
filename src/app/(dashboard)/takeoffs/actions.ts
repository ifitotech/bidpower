"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { addTakeoffPlan, createTakeoff, getTakeoffPlanUrl, mutateRow, setTakeoffVerified, takeoffToMaterialRequest, updateTakeoff, type RowOp } from "@/lib/services/takeoffs";

export type TakeoffResult = { errorCode?: string; success?: boolean; id?: string; url?: string; requestId?: string; projectId?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const canTakeoff = (c: { role: string; perms: { can_create_pricing_request: boolean } }) => c.role === "owner" || c.role === "manager" || c.perms.can_create_pricing_request;

function fail(e: unknown): TakeoffResult {
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
  const rules: [string, string][] = [
    ["takeoff_needs_manager", "errTakeoffNeedsManager"], ["takeoff_title_required", "errTakeoffTitle"], ["takeoff_invalid", "errTakeoffInvalid"], ["takeoff_empty", "errTakeoffEmpty"],
    ["request_too_large", "errRequestTooLarge"], ["file_type", "errFileType"], ["file_size", "errFileSize25"], ["forbidden", "errForbidden"], ["row-level security", "errForbidden"],
    ["violates check constraint", "errTakeoffInvalid"],
  ];
  const hit = rules.find(([k]) => msg.includes(k));
  return { errorCode: hit ? hit[1] : "errGeneric" };
}

async function ctx() {
  try { return await getActionContext(); } catch { return null; }
}

function refresh(id?: string, projectId?: string) {
  if (id) revalidatePath(`/takeoffs/${id}`);
  if (projectId) revalidatePath(`/projects/${projectId}/takeoff`);
}

export async function createTakeoffAction(projectId: string, title: string, notes?: string): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(projectId)) return { errorCode: "errGeneric" };
  if (!canTakeoff(c)) return { errorCode: "errForbidden" };
  try { const id = await createTakeoff(c.companyId, c.userId, { projectId, title: String(title ?? ""), notes }); refresh(id, projectId); return { success: true, id }; } catch (e) { return fail(e); }
}

export async function updateTakeoffAction(id: string, patch: { title?: string; notes?: string | null; waste_pct?: number }): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(id)) return { errorCode: "errGeneric" };
  if (!canTakeoff(c)) return { errorCode: "errForbidden" };
  try { await updateTakeoff(c.companyId, id, patch ?? {}); refresh(id); return { success: true }; } catch (e) { return fail(e); }
}

export async function verifyTakeoffAction(id: string, verified: boolean): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(id)) return { errorCode: "errGeneric" };
  if (c.role !== "owner" && c.role !== "manager") return { errorCode: "errTakeoffNeedsManager" };
  try { await setTakeoffVerified(c.companyId, id, Boolean(verified)); refresh(id); return { success: true }; } catch (e) { return fail(e); }
}

export async function takeoffRowAction(takeoffId: string, op: RowOp): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(takeoffId) || !op || typeof op !== "object") return { errorCode: "errGeneric" };
  if (!canTakeoff(c)) return { errorCode: "errForbidden" };
  for (const v of [(op as { id?: string }).id, (op as { panelId?: string }).panelId, (op as { takeoffId?: string }).takeoffId]) if (v && !UUID.test(v)) return { errorCode: "errGeneric" };
  try { await mutateRow(c.companyId, op); refresh(takeoffId); return { success: true }; } catch (e) { return fail(e); }
}

export async function addPlanAction(formData: FormData): Promise<TakeoffResult> {
  const c = await ctx();
  const id = String(formData.get("takeoffId") ?? "");
  const file = formData.get("file");
  if (!c || !UUID.test(id) || !(file instanceof File) || file.size === 0) return { errorCode: "errGeneric" };
  if (!canTakeoff(c) || !c.perms.can_upload_documents) return { errorCode: "errForbidden" };
  try { await addTakeoffPlan(c.companyId, c.userId, id, file); refresh(id); return { success: true }; } catch (e) { return fail(e); }
}

export async function getPlanUrlAction(documentId: string): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(documentId)) return { errorCode: "errGeneric" };
  try { return { success: true, url: await getTakeoffPlanUrl(c.companyId, documentId) }; } catch (e) { return fail(e); }
}

export async function takeoffToRequestAction(id: string): Promise<TakeoffResult> {
  const c = await ctx();
  if (!c || !UUID.test(id)) return { errorCode: "errGeneric" };
  if (!c.perms.can_request_material) return { errorCode: "errForbidden" };
  try {
    const r = await takeoffToMaterialRequest(c.companyId, c.userId, id);
    refresh(id);
    revalidatePath("/materials/requests");
    return { success: true, requestId: r.id };
  } catch (e) { return fail(e); }
}
