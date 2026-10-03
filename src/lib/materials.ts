// Materials (Phase 3): shared constants and pure helpers. No I/O here so it is easy to test.

export const MATERIAL_CATEGORIES = [
  { code: "conduit", key: "catConduit" },
  { code: "wire", key: "catWire" },
  { code: "boxes", key: "catBoxes" },
  { code: "fittings", key: "catFittings" },
  { code: "devices", key: "catDevices" },
  { code: "breakers", key: "catBreakers" },
  { code: "panels", key: "catPanels" },
  { code: "lighting", key: "catLighting" },
  { code: "gear", key: "catGear" },
  { code: "other", key: "catOther" },
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number]["code"];
export const CATEGORY_CODES: readonly string[] = MATERIAL_CATEGORIES.map((c) => c.code);

// Units are short codes that every supply house recognises, so they are not translated.
export const MATERIAL_UNITS = ["EA", "FT", "ROLL", "BOX", "BAG", "SET", "PAIR", "LOT", "CT", "PKG"] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

export function normalizeUnit(value: string | null | undefined): string {
  const v = (value ?? "").trim().toUpperCase();
  if (!v) return "EA";
  if (v === "EACH" || v === "PC" || v === "PCS" || v === "UN" || v === "UND") return "EA";
  if (v === "FEET" || v === "FOOT" || v === "PIES" || v === "PIE" || v === "PÉS") return "FT";
  if (v === "ROLLS" || v === "ROLLO" || v === "ROLLOS") return "ROLL";
  if (v === "BOXES" || v === "CAJA" || v === "CAJAS") return "BOX";
  return (MATERIAL_UNITS as readonly string[]).includes(v) ? v : "EA";
}

/** Lowercase, no accents, single spaces: used for matching and de-duplication. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type LibraryItem = {
  id: string;
  description: string;
  unit: string;
  category: string | null;
  manufacturer?: string | null;
  catalog_number?: string | null;
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  aliases: string[];
};

// Field shorthand and Spanish colour names, so "thhn 8 red", "THHN #8 RD" and "thhn 8 rojo" find the same wire.
const WORD_SYNONYMS: Record<string, string> = {
  blk: "black", negro: "black", wht: "white", wh: "white", blanco: "white", grn: "green", gn: "green", verde: "green",
  blu: "blue", azul: "blue", org: "orange", naranja: "orange", yel: "yellow", ylw: "yellow", amarillo: "yellow",
  gry: "gray", grey: "gray", gris: "gray", brn: "brown", cafe: "brown", rd: "red", rojo: "red", vermelho: "red", preto: "black", branco: "white", amarelo: "yellow", cinza: "gray", str: "stranded", sol: "solid",
};

/** Punctuation becomes spaces ("THHN-10-STR-BLK", "#8") and shorthand words are unified. Expects normalizeText output. */
function canonical(text: string): string {
  return text
    .replace(/([a-z]{2,})(\d)/g, "$1 $2") // "thhn8blk" -> "thhn 8blk"
    .replace(/(\d)([a-z]{2,})/g, "$1 $2") // "8blk" -> "8 blk"; "20a" stays together
    .replace(/#/g, " ")
    .replace(/[-_,()]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => WORD_SYNONYMS[w] ?? w)
    .join(" ");
}

/** A plain number must match a whole number ("8" must not match "18" or "80"); other words match as text. */
function tokenMatches(haystack: string, token: string): boolean {
  if (/^\d+$/.test(token)) return new RegExp(`(^|[^0-9.])${token}(?![0-9])`).test(haystack);
  return haystack.includes(token);
}

/**
 * Splits "thhn 8 red x 500" or "500 x thhn 8 red" into the search text and a quantity.
 * Only explicit shapes count, so the 8 in "thhn 8 red" is never taken as a quantity.
 */
export function splitQuantity(text: string): { text: string; quantity: number | null } {
  const raw = text.trim();
  if (!raw) return { text: "", quantity: null };
  const [line] = parsePastedList(raw, 1);
  if (!line || line.description === raw) return { text: raw, quantity: null };
  return { text: line.description, quantity: line.quantity };
}

/**
 * Search the library while typing. Empty query = favorites first, then recent, then most used.
 * A typed query matches the name, aliases (field slang like "romex" or "mud ring") and catalog number.
 */
export function searchLibrary(items: LibraryItem[], query: string, limit = 12): LibraryItem[] {
  const q = normalizeText(query);
  const byUse = (a: LibraryItem, b: LibraryItem) =>
    Number(b.is_favorite) - Number(a.is_favorite) ||
    (b.last_used_at ?? "").localeCompare(a.last_used_at ?? "") ||
    b.use_count - a.use_count ||
    a.description.localeCompare(b.description);

  if (!q) return [...items].sort(byUse).slice(0, limit);

  const tokens = canonical(q).split(" ");
  const scored: { item: LibraryItem; score: number }[] = [];
  for (const item of items) {
    const name = canonical(normalizeText(item.description));
    const aliases = item.aliases.map((a) => canonical(normalizeText(a)));
    const catalog = canonical(normalizeText(item.catalog_number ?? ""));
    const haystack = [name, ...aliases, catalog].join(" | ");
    if (!tokens.every((t) => tokenMatches(haystack, t))) continue;
    const cq = tokens.join(" ");
    let score = 1;
    if (name === cq || aliases.includes(cq)) score += 100;
    else if (name.startsWith(cq) || aliases.some((a) => a.startsWith(cq))) score += 40;
    else if (name.includes(cq)) score += 20;
    if (item.is_favorite) score += 5;
    if (item.use_count > 0) score += Math.min(4, item.use_count);
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score || byUse(a.item, b.item)).slice(0, limit).map((s) => s.item);
}

/** Exact match by name or alias, so a pasted line links to the library instead of becoming free text. */
export function findExact(items: LibraryItem[], text: string): LibraryItem | undefined {
  const q = normalizeText(text);
  if (!q) return undefined;
  return items.find((i) => normalizeText(i.description) === q || i.aliases.some((a) => normalizeText(a) === q));
}

export type ParsedLine = { description: string; quantity: number; unit: string | null };

const UNIT_WORDS = "ea|each|ft|feet|foot|roll|rolls|box|boxes|bag|bags|set|sets|pair|pairs|lot|ct|pkg|pc|pcs|pza|pzas|und|un|pies|rollo|rollos|caja|cajas";
const QTY = "(\\d+(?:[.,]\\d+)?)";

/**
 * Turns text pasted from an email, WhatsApp or Excel into lines. One item per line. Recognised shapes:
 *   "20 x 3/4 EMT"   "20x 3/4 EMT"   "20 - 3/4 EMT"   "20 ea 3/4 EMT"
 *   "3/4 EMT x 20"   "3/4 EMT - 20"  "3/4 EMT, 20 ea"  "3/4 EMT (20)"
 * A number that is part of the name ("12/2 Romex 250ft", "1/2 EMT") is never taken as the quantity.
 * Tab-separated rows (Excel) are read as "description<TAB>quantity[<TAB>unit]".
 */
export function parsePastedList(text: string, maxLines = 200): ParsedLine[] {
  const out: ParsedLine[] = [];
  const num = (s: string) => Number(s.replace(",", "."));
  for (const raw of text.split(/\r?\n/)) {
    if (out.length >= maxLines) break;
    let line = raw.replace(/^\s*(?:[-•*·▪●]|\d+[.)])\s+/, "").trim();
    if (!line) continue;

    if (line.includes("\t")) {
      const cols = line.split("\t").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2 && /^\d+(?:[.,]\d+)?$/.test(cols[1])) {
        out.push({ description: cols[0], quantity: num(cols[1]) || 1, unit: cols[2] ? normalizeUnit(cols[2]) : null });
        continue;
      }
      line = cols.join(" ");
    }

    let m = line.match(new RegExp(`^${QTY}\\s*(?:x|×|\\*|-|:)\\s+(.+)$`, "i")); // "20 x desc"
    if (m) { out.push({ description: m[2].trim(), quantity: num(m[1]) || 1, unit: null }); continue; }

    m = line.match(new RegExp(`^${QTY}\\s*(${UNIT_WORDS})\\s+(.+)$`, "i")); // "20 ea desc"
    if (m) { out.push({ description: m[3].trim(), quantity: num(m[1]) || 1, unit: normalizeUnit(m[2]) }); continue; }

    m = line.match(new RegExp(`^(.+?)\\s*(?:\\s+x|×|\\s-|:|,)\\s*${QTY}\\s*(${UNIT_WORDS})?$`, "i")); // "desc x 20 ea"
    if (m && m[1].trim()) { out.push({ description: m[1].trim(), quantity: num(m[2]) || 1, unit: m[3] ? normalizeUnit(m[3]) : null }); continue; }

    m = line.match(new RegExp(`^(.+?)\\s*\\(\\s*${QTY}\\s*(${UNIT_WORDS})?\\s*\\)$`, "i")); // "desc (20)"
    if (m && m[1].trim()) { out.push({ description: m[1].trim(), quantity: num(m[2]) || 1, unit: m[3] ? normalizeUnit(m[3]) : null }); continue; }

    out.push({ description: line, quantity: 1, unit: null });
  }
  return out.filter((l) => l.description.length > 0 && l.description.length <= 300);
}

export const REQUEST_STATUSES = ["requested", "reviewed", "rejected", "converted", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type RequestLineInput = {
  materialId: string | null;
  description: string;
  quantity: number;
  unit: string;
  category: string | null;
  notes: string | null;
  allowSubstitution: boolean;
};

/** Merges lines that point at the same library item or have the same text, adding quantities. */
export function mergeLines(lines: RequestLineInput[]): RequestLineInput[] {
  const out: RequestLineInput[] = [];
  for (const line of lines) {
    const key = line.materialId ?? `t:${normalizeText(line.description)}`;
    const existing = out.find((l) => (l.materialId ?? `t:${normalizeText(l.description)}`) === key && l.unit === line.unit);
    if (existing) existing.quantity = Math.round((existing.quantity + line.quantity) * 100) / 100;
    else out.push({ ...line });
  }
  return out;
}
