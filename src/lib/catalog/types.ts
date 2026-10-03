import type { LibraryItem } from "@/lib/materials";

/** One item of the standard catalog (data/bidpower_materials.csv, compacted by scripts/build-catalog.py). */
export type CatalogItem = { i: string; n: string; u: string; c: string; a: string[]; m?: string };

export const CATALOG_PREFIX = "cat:";

/** Catalog items search like the company's own library items; the id carries the prefix so the two never mix up. */
export function catalogToLibrary(c: CatalogItem): LibraryItem {
  return {
    id: CATALOG_PREFIX + c.i, description: c.n, unit: c.u, category: c.c, manufacturer: c.m ?? null, catalog_number: null,
    is_favorite: false, use_count: 0, last_used_at: null, aliases: c.a,
  };
}
