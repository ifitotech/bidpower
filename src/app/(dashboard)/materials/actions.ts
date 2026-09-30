"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { CATEGORY_CODES, normalizeUnit, type RequestLineInput } from "@/lib/materials";
import {
  archiveMaterial, createMaterial, getMaterialPriceHistory, type PricePoint, createSavedList, deleteSavedList, setMaterialFavorite, updateMaterial,
} from "@/lib/services/materials";
import { cancelMaterialRequest, createMaterialRequest, reviewMaterialRequest } from "@/lib/services/material-requests";

export async function getMaterialPricesAction(materialId: string): Promise<{ errorCode?: string; prices?: PricePoint[] }> {
  const c = await ctx();
  if (!c || !UUID.test(materialId)) return { errorCode: "errGeneric" };
  if (!c.perms.can_view_costs && c.role !== "owner") return { errorCode: "errForbidden" };
  try { return { prices: await getMaterialPriceHistory(c.companyId, materialId) }; } catch { return { errorCode: "errGeneric" }; }
}

export type MaterialResult = { errorCode?: string; success?: boolean; id?: string; number?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(e: unknown): MaterialResult {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "request_empty") return { errorCode: "errRequestEmpty" };
  if (msg === "request_too_large") return { errorCode: "errRequestTooLarge" };
  if (msg === "request_not_pending") return { errorCode: "errRequestNotPending" };
  if (msg === "item_required") return { errorCode: "errItemRequired" };
  if (msg === "list_name_required" || msg === "list_empty") return { errorCode: "errListInvalid" };
  if (msg === "forbidden") return { errorCode: "errForbidden" };
  return { errorCode: "errGeneric" };
}

async function ctx() {
  try { return await getActionContext(); } catch { return null; }
}

function parseItem(raw: Record<string, unknown>) {
  return {
    description: String(raw.description ?? ""),
    unit: String(raw.unit ?? "EA"),
    category: raw.category ? String(raw.category) : null,
    manufacturer: raw.manufacturer ? String(raw.manufacturer) : null,
    catalog_number: raw.catalog_number ? String(raw.catalog_number) : null,
    notes: raw.notes ? String(raw.notes) : null,
    allow_substitution: Boolean(raw.allow_substitution),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : [],
  };
}

export async function saveMaterialAction(raw: Record<string, unknown>): Promise<MaterialResult> {
  const c = await ctx();
  if (!c) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  try {
    const item = parseItem(raw);
    const id = typeof raw.id === "string" && UUID.test(raw.id) ? raw.id : null;
    if (id) await updateMaterial(c.companyId, id, item);
    else await createMaterial(c.companyId, c.userId, item);
    revalidatePath("/materials");
    return { success: true };
  } catch (e) { return fail(e); }
}

export async function toggleFavoriteAction(materialId: string, favorite: boolean): Promise<MaterialResult> {
  const c = await ctx();
  if (!c || !UUID.test(materialId)) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  try { await setMaterialFavorite(c.companyId, materialId, favorite); revalidatePath("/materials"); return { success: true }; } catch (e) { return fail(e); }
}

export async function archiveMaterialAction(materialId: string): Promise<MaterialResult> {
  const c = await ctx();
  if (!c || !UUID.test(materialId)) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  try { await archiveMaterial(c.companyId, materialId); revalidatePath("/materials"); return { success: true }; } catch (e) { return fail(e); }
}

export async function deleteListAction(listId: string): Promise<MaterialResult> {
  const c = await ctx();
  if (!c || !UUID.test(listId)) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  try { await deleteSavedList(c.companyId, listId); revalidatePath("/materials"); return { success: true }; } catch (e) { return fail(e); }
}

type LinePayload = {
  materialId?: string | null; description?: string; quantity?: number; unit?: string; category?: string | null;
  notes?: string | null; allowSubstitution?: boolean; saveToLibrary?: boolean;
};

export type RequestPayload = {
  projectId: string; neededBy?: string | null; notes?: string | null; lines: LinePayload[];
  saveListName?: string | null;
};

/**
 * Creates the Material Request. Free-text lines stay free text unless the caller can manage the library
 * and ticked "save to library"; a list is saved only for people who can manage the library.
 */
export async function createMaterialRequestAction(payload: RequestPayload): Promise<MaterialResult> {
  const c = await ctx();
  if (!c) return { errorCode: "errGeneric" };
  if (!c.perms.can_request_material) return { errorCode: "errForbidden" };
  if (!payload || !UUID.test(payload.projectId) || !Array.isArray(payload.lines)) return { errorCode: "errGeneric" };
  if (payload.neededBy && !/^\d{4}-\d{2}-\d{2}$/.test(payload.neededBy)) return { errorCode: "errGeneric" };

  try {
    const lines: RequestLineInput[] = [];
    for (const l of payload.lines.slice(0, 301)) {
      const description = String(l.description ?? "").trim();
      const quantity = Number(l.quantity);
      if (!description || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) continue;
      const unit = normalizeUnit(l.unit);
      const category = l.category && CATEGORY_CODES.includes(l.category) ? l.category : null;
      let materialId = l.materialId && UUID.test(l.materialId) ? l.materialId : null;
      if (!materialId && l.saveToLibrary && c.perms.can_manage_library) {
        materialId = await createMaterial(c.companyId, c.userId, { description, unit, category });
      }
      lines.push({
        materialId, description, quantity, unit, category,
        notes: l.notes ? String(l.notes) : null, allowSubstitution: Boolean(l.allowSubstitution),
      });
    }
    const result = await createMaterialRequest(c.companyId, c.userId, {
      projectId: payload.projectId, neededBy: payload.neededBy, notes: payload.notes, lines,
    });

    if (payload.saveListName?.trim() && c.perms.can_manage_library) {
      const linked = lines.filter((l) => l.materialId).map((l) => ({ materialId: l.materialId as string, quantity: l.quantity }));
      if (linked.length) await createSavedList(c.companyId, c.userId, payload.saveListName, linked).catch(() => undefined);
    }
    revalidatePath(`/projects/${payload.projectId}/materials`);
    revalidatePath("/materials/requests");
    revalidatePath("/dashboard");
    return { success: true, id: result.id, number: result.number };
  } catch (e) { return fail(e); }
}

export async function reviewRequestAction(requestId: string, decision: "reviewed" | "rejected", note?: string): Promise<MaterialResult> {
  const c = await ctx();
  if (!c || !UUID.test(requestId)) return { errorCode: "errGeneric" };
  if (c.role !== "owner" && c.role !== "manager") return { errorCode: "errForbidden" };
  if (decision !== "reviewed" && decision !== "rejected") return { errorCode: "errGeneric" };
  try {
    await reviewMaterialRequest(c.companyId, c.userId, requestId, decision, note);
    revalidatePath("/materials/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) { return fail(e); }
}

export async function cancelRequestAction(requestId: string): Promise<MaterialResult> {
  const c = await ctx();
  if (!c || !UUID.test(requestId)) return { errorCode: "errGeneric" };
  try {
    await cancelMaterialRequest(c.companyId, requestId);
    revalidatePath("/materials/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) { return fail(e); }
}
