"use client";
import type { CatalogItem } from "./types";

let cached: Promise<CatalogItem[]> | null = null;

/** The standard catalog is a separate chunk, downloaded the first time somebody searches (not with every page). */
export function loadCatalog(): Promise<CatalogItem[]> {
  cached ??= import("./materials.json").then((m) => m.default as unknown as CatalogItem[]).catch(() => { cached = null; return []; });
  return cached;
}
