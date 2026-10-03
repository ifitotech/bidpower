import data from "./materials.json";
import type { CatalogItem } from "./types";

const byId = new Map((data as unknown as CatalogItem[]).map((c) => [c.i, c]));
export const getCatalogItem = (id: string): CatalogItem | undefined => byId.get(id);
