// Bulk import of ready-made materials (with part numbers) from a CSV/TSV/pasted spreadsheet. Pure functions: no I/O.
import { CATEGORY_CODES, normalizeText, normalizeUnit } from "@/lib/materials";

export type ImportRow = { description: string; catalog_number: string | null; manufacturer: string | null; unit: string; category: string | null; aliases: string[] };
export type ParsedImport = { rows: ImportRow[]; invalid: number; unknownColumns: string[]; missingDescription: boolean };

export const MAX_IMPORT_ROWS = 2000;

/** Quoted fields, doubled quotes, CRLF/LF, and comma / semicolon / tab separators (Excel in Spanish exports semicolons). */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const counts = { ",": (first.match(/,/g) ?? []).length, ";": (first.match(/;/g) ?? []).length, "\t": (first.match(/\t/g) ?? []).length };
  const sep = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ",") as string;
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const HEADERS: Record<string, string[]> = {
  description: ["description", "descripcion", "descricao", "item", "name", "nombre", "material", "product", "producto"],
  catalog_number: ["part number", "part_number", "partnumber", "part", "pn", "p/n", "catalog", "catalog number", "catalog_number", "catalogo", "numero de parte", "no de parte", "sku", "codigo", "code", "numero da peca"],
  manufacturer: ["manufacturer", "mfr", "brand", "marca", "fabricante"],
  unit: ["unit", "uom", "unidad", "unidade", "um"],
  category: ["category", "categoria"],
  aliases: ["aliases", "alias", "also called", "tambien conocido como", "apodos"],
};

const CATEGORY_WORDS: Record<string, string> = {
  conduit: "conduit", tubo: "conduit", conduc: "conduit", wire: "wire", cable: "wire", alambre: "wire", boxes: "boxes", cajas: "boxes", box: "boxes", fittings: "fittings",
  conectores: "fittings", devices: "devices", dispositivos: "devices", breakers: "breakers", interruptores: "breakers", panels: "panels", paneles: "panels",
  lighting: "lighting", iluminacion: "lighting", luminarias: "lighting", gear: "gear", equipos: "gear", other: "other", otros: "other",
};

function pickCategory(v: string): string | null {
  const n = normalizeText(v);
  if (!n) return null;
  if (CATEGORY_CODES.includes(n)) return n;
  return CATEGORY_WORDS[n] ?? null;
}

export function parseMaterialImport(text: string): ParsedImport {
  const table = parseDelimited(text);
  if (table.length === 0) return { rows: [], invalid: 0, unknownColumns: [], missingDescription: true };
  const header = table[0].map((h) => normalizeText(h));
  const index: Record<string, number> = {};
  const unknownColumns: string[] = [];
  header.forEach((h, i) => {
    const field = Object.keys(HEADERS).find((f) => HEADERS[f].includes(h));
    if (field && index[field] === undefined) index[field] = i;
    else if (h) unknownColumns.push(table[0][i].trim());
  });
  if (index.description === undefined) return { rows: [], invalid: 0, unknownColumns, missingDescription: true };
  const rows: ImportRow[] = [];
  let invalid = 0;
  const seen = new Set<string>();
  for (const r of table.slice(1)) {
    const get = (f: string) => (index[f] === undefined ? "" : (r[index[f]] ?? "").trim());
    const description = get("description").slice(0, 300);
    if (!description) { invalid++; continue; }
    const catalog = get("catalog_number").slice(0, 80) || null;
    const manufacturer = get("manufacturer").slice(0, 80) || null;
    const key = catalog ? `pn:${normalizeText(catalog)}|${normalizeText(manufacturer ?? "")}` : `d:${normalizeText(description)}`;
    if (seen.has(key)) continue; // repeated inside the same file
    seen.add(key);
    rows.push({
      description, catalog_number: catalog, manufacturer, unit: normalizeUnit(get("unit")), category: pickCategory(get("category")),
      aliases: get("aliases") ? get("aliases").split(/[|,]/).map((a) => a.trim()).filter(Boolean).slice(0, 12) : [],
    });
    if (rows.length >= MAX_IMPORT_ROWS) break;
  }
  return { rows, invalid, unknownColumns, missingDescription: false };
}

/** Index of what the library already has, to recognise repeats. A part number without a manufacturer matches any manufacturer. */
export function buildLibraryIndex(items: { description: string; catalog_number?: string | null; manufacturer?: string | null }[]) {
  const byPn = new Map<string, Set<string>>();
  const byName = new Set<string>();
  for (const m of items) {
    if (m.catalog_number) {
      const k = normalizeText(m.catalog_number);
      (byPn.get(k) ?? byPn.set(k, new Set()).get(k)!).add(normalizeText(m.manufacturer ?? ""));
    } else byName.add(normalizeText(m.description));
  }
  return { byPn, byName };
}

export function isInLibrary(index: ReturnType<typeof buildLibraryIndex>, row: { description: string; catalog_number?: string | null; manufacturer?: string | null }): boolean {
  if (!row.catalog_number) return index.byName.has(normalizeText(row.description));
  const mfrs = index.byPn.get(normalizeText(row.catalog_number));
  if (!mfrs) return false;
  const m = normalizeText(row.manufacturer ?? "");
  return !m || mfrs.has(m) || mfrs.has("");
}

/** Key used to recognise a material that is already in the library. */
export function materialKey(m: { description: string; catalog_number?: string | null; manufacturer?: string | null }): string {
  return m.catalog_number ? `pn:${normalizeText(m.catalog_number)}|${normalizeText(m.manufacturer ?? "")}` : `d:${normalizeText(m.description)}`;
}

export const IMPORT_TEMPLATE = "﻿description,part number,manufacturer,unit,category,aliases\r\nTHHN 10 AWG stranded black,THHN-10-STR-BLK,Southwire,FT,wire,\"cable 10 negro, #10 black\"\r\n20A single-pole breaker,BR120,Eaton,EA,breakers,\r\n";
