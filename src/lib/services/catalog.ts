import { createClient } from "@/lib/supabase/server";
import { canonicalText, searchPatterns } from "@/lib/materials";
import type { CatalogItem } from "@/lib/catalog/types";

type Row = { id: string; name: string; unit: string; category: string; manufacturer: string | null; aliases: string[] | null };
const toItem = (r: Row): CatalogItem => ({ i: r.id, n: r.name, u: r.unit, c: r.category, a: r.aliases ?? [], ...(r.manufacturer ? { m: r.manufacturer } : {}) });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Standard-catalog items matching what was typed (every word must match). The caller ranks the few hundred candidates it gets back. */
export async function searchCatalog(query: string, limit = 200): Promise<CatalogItem[]> {
  const patterns = searchPatterns(query.slice(0, 120));
  if (patterns.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catalog_search", { p_patterns: patterns, p_query: canonicalText(query.slice(0, 120)), p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(toItem);
}

export async function getCatalogItem(id: string): Promise<CatalogItem | undefined> {
  if (!UUID.test(id)) return undefined;
  const supabase = await createClient();
  const { data, error } = await supabase.from("catalog_materials").select("id, name, unit, category, manufacturer, aliases").eq("id", id).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return data ? toItem(data as Row) : undefined;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_platform_admin");
  return !error && data === true;
}

export async function catalogCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("catalog_materials").select("id", { count: "exact", head: true }).eq("is_active", true);
  return count ?? 0;
}
