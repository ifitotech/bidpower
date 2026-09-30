import { createClient } from "@/lib/supabase/server";
import { buildLibraryIndex, isInLibrary, type ImportRow } from "@/lib/material-import";
import { CATEGORY_CODES, normalizeText, normalizeUnit, type LibraryItem } from "@/lib/materials";

type MaterialRow = {
  id: string; description: string; unit: string; category: string | null; manufacturer: string | null;
  catalog_number: string | null; notes: string | null; allow_substitution: boolean; is_favorite: boolean;
  use_count: number; last_used_at: string | null; aliases?: { alias: string }[] | null;
};

const toItem = (m: MaterialRow): LibraryItem & { notes: string | null; allow_substitution: boolean } => ({
  id: m.id, description: m.description, unit: m.unit, category: m.category, manufacturer: m.manufacturer,
  catalog_number: m.catalog_number, notes: m.notes, allow_substitution: m.allow_substitution,
  is_favorite: m.is_favorite, use_count: m.use_count, last_used_at: m.last_used_at,
  aliases: (m.aliases ?? []).map((a) => a.alias),
});

/** Active library items of the company (RLS also limits the rows). */
export async function getMaterials(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_materials")
    .select("id, description, unit, category, manufacturer, catalog_number, notes, allow_substitution, is_favorite, use_count, last_used_at, aliases:material_aliases(alias)")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("description", { ascending: true })
    .limit(2000);
  if (error) throw error;
  return (data as unknown as MaterialRow[]).map(toItem);
}

export type MaterialInput = {
  description: string;
  unit?: string;
  category?: string | null;
  manufacturer?: string | null;
  catalog_number?: string | null;
  notes?: string | null;
  allow_substitution?: boolean;
  aliases?: string[];
};

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
const cleanAliases = (aliases: string[] | undefined, name: string) => {
  const seen = new Set<string>([normalizeText(name)]);
  const out: string[] = [];
  for (const a of aliases ?? []) {
    const t = a.trim();
    const k = normalizeText(t);
    if (t && !seen.has(k)) { seen.add(k); out.push(t.slice(0, 80)); }
  }
  return out.slice(0, 12);
};

async function replaceAliases(companyId: string, materialId: string, aliases: string[]) {
  const supabase = await createClient();
  const del = await supabase.from("material_aliases").delete().eq("material_id", materialId).eq("company_id", companyId);
  if (del.error) throw del.error;
  if (aliases.length) {
    const ins = await supabase.from("material_aliases").insert(aliases.map((alias) => ({ company_id: companyId, material_id: materialId, alias })));
    if (ins.error) throw ins.error;
  }
}

export async function createMaterial(companyId: string, userId: string, input: MaterialInput) {
  const supabase = await createClient();
  const description = input.description.trim().slice(0, 300);
  if (!description) throw new Error("item_required");
  const { data, error } = await supabase
    .from("company_materials")
    .insert({
      company_id: companyId, created_by: userId, description,
      unit: normalizeUnit(input.unit),
      category: input.category && CATEGORY_CODES.includes(input.category) ? input.category : null,
      manufacturer: clean(input.manufacturer), catalog_number: clean(input.catalog_number), notes: clean(input.notes),
      allow_substitution: Boolean(input.allow_substitution),
    })
    .select("id")
    .single();
  if (error) throw error;
  await replaceAliases(companyId, data.id as string, cleanAliases(input.aliases, description));
  return data.id as string;
}

export async function updateMaterial(companyId: string, materialId: string, input: MaterialInput) {
  const supabase = await createClient();
  const description = input.description.trim().slice(0, 300);
  if (!description) throw new Error("item_required");
  const { data, error } = await supabase
    .from("company_materials")
    .update({
      description, unit: normalizeUnit(input.unit),
      category: input.category && CATEGORY_CODES.includes(input.category) ? input.category : null,
      manufacturer: clean(input.manufacturer), catalog_number: clean(input.catalog_number), notes: clean(input.notes),
      allow_substitution: Boolean(input.allow_substitution), updated_at: new Date().toISOString(),
    })
    .eq("id", materialId)
    .eq("company_id", companyId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
  await replaceAliases(companyId, materialId, cleanAliases(input.aliases, description));
}

export async function setMaterialFavorite(companyId: string, materialId: string, favorite: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("company_materials").update({ is_favorite: favorite }).eq("id", materialId).eq("company_id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

/** Soft delete: past requests and lists keep pointing at the item. */
export async function archiveMaterial(companyId: string, materialId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("company_materials").update({ is_active: false }).eq("id", materialId).eq("company_id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

// ---- Saved lists (material_assemblies) ----

export type SavedList = { id: string; name: string; items: { materialId: string; quantity: number }[] };

export async function getSavedLists(companyId: string): Promise<SavedList[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_assemblies")
    .select("id, name, items:assembly_items(material_id, quantity, sort_order)")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    name: l.name as string,
    items: ((l.items ?? []) as { material_id: string; quantity: number; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ materialId: i.material_id, quantity: Number(i.quantity) })),
  }));
}

export async function createSavedList(companyId: string, userId: string, name: string, items: { materialId: string; quantity: number }[]) {
  const supabase = await createClient();
  const cleanName = name.trim().slice(0, 120);
  if (!cleanName) throw new Error("list_name_required");
  if (items.length === 0) throw new Error("list_empty");
  const { data, error } = await supabase.from("material_assemblies").insert({ company_id: companyId, created_by: userId, name: cleanName }).select("id").single();
  if (error) throw error;
  const ins = await supabase.from("assembly_items").insert(
    items.map((i, idx) => ({ company_id: companyId, assembly_id: data.id, material_id: i.materialId, quantity: i.quantity, sort_order: idx }))
  );
  if (ins.error) {
    await supabase.from("material_assemblies").delete().eq("id", data.id).eq("company_id", companyId);
    throw ins.error;
  }
  return data.id as string;
}

export async function deleteSavedList(companyId: string, listId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_assemblies").delete().eq("id", listId).eq("company_id", companyId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

export type PricePoint = { source: "po" | "quote"; vendor: string; price: number; date: string; unit: string | null };

/**
 * What this material actually cost or was quoted at before: real purchase order lines and real supplier quotes, newest first.
 * Nothing is estimated; a material with no history returns an empty list.
 */
export async function getMaterialPriceHistory(companyId: string, materialId: string, limit = 10): Promise<PricePoint[]> {
  const supabase = await createClient();
  const [pos, reqItems] = await Promise.all([
    supabase.from("purchase_order_items").select("unit_price, unit, po:purchase_orders(vendor_name, status, created_at)").eq("company_id", companyId).eq("material_id", materialId).limit(50),
    supabase.from("supply_quote_request_items").select("id").eq("company_id", companyId).eq("material_id", materialId).limit(200),
  ]);
  if (pos.error) throw pos.error;
  if (reqItems.error) throw reqItems.error;
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const out: PricePoint[] = [];
  for (const r of pos.data ?? []) {
    const po = one(r.po as { vendor_name: string; status: string; created_at: string } | { vendor_name: string; status: string; created_at: string }[] | null);
    if (!po || ["cancelled", "rejected"].includes(po.status)) continue;
    out.push({ source: "po", vendor: po.vendor_name, price: Number(r.unit_price), date: po.created_at, unit: r.unit as string });
  }
  const ids = (reqItems.data ?? []).map((r) => r.id as string);
  if (ids.length) {
    const { data, error } = await supabase.from("supplier_quote_response_items").select("unit_price, response:supplier_quote_responses(supplier_name, status, submitted_at, created_at)").eq("company_id", companyId).in("request_item_id", ids).not("unit_price", "is", null).limit(100);
    if (error) throw error;
    for (const r of data ?? []) {
      const resp = one(r.response as { supplier_name: string; status: string; submitted_at: string | null; created_at: string } | { supplier_name: string; status: string; submitted_at: string | null; created_at: string }[] | null);
      if (!resp || !["submitted", "accepted"].includes(resp.status)) continue;
      out.push({ source: "quote", vendor: resp.supplier_name, price: Number(r.unit_price), date: resp.submitted_at ?? resp.created_at, unit: null });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}


/** Bulk import: skips what the library already has (same part number + manufacturer, or same name when there is no part number). */
export async function importMaterials(companyId: string, userId: string, rows: ImportRow[]): Promise<{ created: number; skipped: number }> {
  if (!rows.length || rows.length > 2000) throw new Error("import_invalid");
  const supabase = await createClient();
  const { data: existing, error } = await supabase.from("company_materials").select("description, catalog_number, manufacturer").eq("company_id", companyId).eq("is_active", true).limit(20000);
  if (error) throw error;
  const index = buildLibraryIndex((existing ?? []) as { description: string; catalog_number: string | null; manufacturer: string | null }[]);
  const fresh = rows.filter((r) => !isInLibrary(index, r));
  let created = 0;
  for (let i = 0; i < fresh.length; i += 200) {
    const chunk = fresh.slice(i, i + 200);
    const { data, error: insErr } = await supabase.from("company_materials").insert(chunk.map((r) => ({
      company_id: companyId, created_by: userId, description: r.description.trim().slice(0, 300), unit: normalizeUnit(r.unit),
      category: r.category && CATEGORY_CODES.includes(r.category) ? r.category : null, manufacturer: clean(r.manufacturer), catalog_number: clean(r.catalog_number),
    }))).select("id");
    if (insErr) throw insErr;
    created += data?.length ?? 0;
    const aliasRows = (data ?? []).flatMap((m, k) => cleanAliases(chunk[k].aliases, chunk[k].description).map((alias) => ({ company_id: companyId, material_id: m.id as string, alias })));
    if (aliasRows.length) {
      const { error: aErr } = await supabase.from("material_aliases").insert(aliasRows);
      if (aErr) throw aErr;
    }
  }
  return { created, skipped: rows.length - fresh.length };
}
