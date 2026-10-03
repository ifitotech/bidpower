"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/services/catalog";
import type { CatalogRow } from "@/lib/catalog/build";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads one chunk of the standard catalog. The database refuses anyone who is not a platform admin. */
export async function catalogImportAction(rows: CatalogRow[], batch: string): Promise<{ errorCode?: string; saved?: number }> {
  if (!UUID.test(batch) || !Array.isArray(rows) || rows.length === 0 || rows.length > 500) return { errorCode: "errGeneric" };
  if (!(await isPlatformAdmin())) return { errorCode: "errForbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catalog_import", { p_rows: rows, p_batch: batch });
  if (error) return { errorCode: "errGeneric" };
  return { saved: Number(data ?? 0) };
}

/** After a complete load: hides what the new file no longer has. */
export async function catalogPruneAction(batch: string): Promise<{ errorCode?: string; hidden?: number }> {
  if (!UUID.test(batch)) return { errorCode: "errGeneric" };
  if (!(await isPlatformAdmin())) return { errorCode: "errForbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catalog_prune", { p_batch: batch });
  if (error) return { errorCode: "errGeneric" };
  return { hidden: Number(data ?? 0) };
}
