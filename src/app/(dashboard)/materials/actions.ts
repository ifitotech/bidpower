"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { parseMaterialImport } from "@/lib/material-import";
import { getCatalogItem, searchCatalog } from "@/lib/services/catalog";
import type { CatalogItem } from "@/lib/catalog/types";
import { CATEGORY_CODES, normalizeText, normalizeUnit, type RequestLineInput } from "@/lib/materials";
import {
  getMaterials, ensureMaterialFromCatalog, archiveMaterial, createMaterial, importMaterials, getMaterialPriceHistory, type PricePoint, createSavedList, upsertSavedList, deleteSavedList, setMaterialFavorite, updateMaterial,
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
  if (msg === "import_invalid") return { errorCode: "errImportEmpty" };
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

export async function importMaterialsAction(text: string, listName?: string): Promise<MaterialResult & { created?: number; skipped?: number; listItems?: number }> {
  const c = await ctx();
  if (!c) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  if (typeof text !== "string" || text.length > 2_000_000) return { errorCode: "errImportEmpty" };
  const parsed = parseMaterialImport(text);
  if (parsed.rows.length === 0) return { errorCode: "errImportEmpty" };
  try {
    const r = await importMaterials(c.companyId, c.userId, parsed.rows);
    // Optionally keep the file as a reusable list (with its quantities), linking each row to its library item, new or existing.
    let listItems = 0;
    if (listName?.trim()) {
      const library = await getMaterials(c.companyId);
      const byPn = new Map<string, string>();
      const byName = new Map<string, string>();
      for (const m of library) {
        if (m.catalog_number) { const k = normalizeText(m.catalog_number); if (!byPn.has(k)) byPn.set(k, m.id); }
        const k = normalizeText(m.description); if (!byName.has(k)) byName.set(k, m.id);
      }
      const entries = parsed.rows.map((row) => ({ materialId: (row.catalog_number && byPn.get(normalizeText(row.catalog_number))) || byName.get(normalizeText(row.description)), quantity: row.quantity ?? 1 }))
        .filter((e): e is { materialId: string; quantity: number } => Boolean(e.materialId));
      if (entries.length) { await upsertSavedList(c.companyId, c.userId, listName, entries); listItems = entries.length; }
    }
    revalidatePath("/materials");
    return { success: true, ...r, listItems };
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
  notes?: string | null; allowSubstitution?: boolean; saveToLibrary?: boolean; catalogId?: string | null;
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
      // A standard-catalog pick joins the company library (reusing an item with the same name); without library permission it stays a named free-text line.
      const fromCatalog = !materialId && l.catalogId ? await getCatalogItem(String(l.catalogId)) : undefined;
      if (fromCatalog && c.perms.can_manage_library) materialId = await ensureMaterialFromCatalog(c.companyId, c.userId, fromCatalog);
      else if (!materialId && l.saveToLibrary && c.perms.can_manage_library) {
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

/**
 * Saves the lines being built as a reusable list, without sending a request. Lines typed as free text
 * are added to the library first, so the list never loses them. Saving under an existing name replaces that list.
 */
export async function saveListAction(payload: { name: string; lines: { materialId?: string | null; catalogId?: string | null; description?: string; quantity?: number; unit?: string; category?: string | null }[] }): Promise<MaterialResult & { replaced?: boolean }> {
  const c = await ctx();
  if (!c) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  if (!payload || typeof payload.name !== "string" || !Array.isArray(payload.lines)) return { errorCode: "errGeneric" };
  try {
    const items: { materialId: string; quantity: number }[] = [];
    for (const l of payload.lines.slice(0, 301)) {
      const quantity = Number(l.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) continue;
      let materialId = l.materialId && UUID.test(l.materialId) ? l.materialId : null;
      const description = String(l.description ?? "").trim();
      const fromCatalog = !materialId && l.catalogId ? await getCatalogItem(String(l.catalogId)) : undefined;
      if (fromCatalog) materialId = await ensureMaterialFromCatalog(c.companyId, c.userId, fromCatalog);
      else if (!materialId && description) {
        const category = l.category && CATEGORY_CODES.includes(l.category) ? l.category : null;
        materialId = await createMaterial(c.companyId, c.userId, { description, unit: normalizeUnit(l.unit), category });
      }
      if (materialId) items.push({ materialId, quantity });
    }
    const saved = await upsertSavedList(c.companyId, c.userId, payload.name, items);
    revalidatePath("/materials");
    revalidatePath("/projects");
    return { success: true, id: saved.id, replaced: saved.replaced };
  } catch (e) { return fail(e); }
}

/** Adds standard-catalog items to the company library (from the library screen). Items already there are reused. */
export async function addCatalogItemsAction(ids: string[]): Promise<MaterialResult & { added?: number }> {
  const c = await ctx();
  if (!c) return { errorCode: "errGeneric" };
  if (!c.perms.can_manage_library) return { errorCode: "errForbidden" };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) return { errorCode: "errGeneric" };
  try {
    let added = 0;
    for (const id of ids) {
      const item = typeof id === "string" ? await getCatalogItem(id) : undefined;
      if (item) { await ensureMaterialFromCatalog(c.companyId, c.userId, item); added++; }
    }
    revalidatePath("/materials");
    return { success: true, added };
  } catch (e) { return fail(e); }
}

/** Search the shared standard catalog while somebody types. Nothing is listed until they type; the answer is at most a few hundred candidates. */
export async function searchCatalogAction(query: string): Promise<{ items: CatalogItem[] }> {
  const c = await ctx();
  if (!c || typeof query !== "string" || query.trim().length < 2) return { items: [] };
  try { return { items: await searchCatalog(query, 200) }; } catch { return { items: [] }; }
}
