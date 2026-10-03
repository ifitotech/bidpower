// Turns the catalog CSV (id, category, subcategory, name, short_description, unit, keywords, active) into the rows the server stores.
// Pure functions: used by the admin upload screen and by the local seeding script.
import { parseDelimited } from "@/lib/material-import";
import { canonicalText, normalizeText } from "@/lib/materials";

export type CatalogRow = { id: string; name: string; unit: string; category: string; manufacturer: string | null; aliases: string[]; search_text: string };
export type CatalogParse = { rows: CatalogRow[]; skipped: number; problems: string[]; byCategory: Record<string, number> };

export const MAX_CATALOG_ROWS = 100_000;

// The CSV can have finer categories than the app: they are folded into the app's ten.
function appCategory(cat: string, sub: string): string {
  if (["Boxes", "Conduit", "Wire", "Devices", "Lighting", "Fittings"].includes(cat)) return cat.toLowerCase();
  if (["Supports", "Hardware", "Connectors"].includes(cat)) return "fittings";
  if (cat === "Consumables") return "other";
  if (cat === "Controls") return "gear";
  if (cat === "Grounding") return sub === "Bare Copper" ? "wire" : "fittings";
  if (cat === "Low Voltage") return sub === "Data Devices" ? "devices" : "wire";
  if (cat === "Distribution") {
    if (sub.includes("Breakers")) return "breakers";
    if (["Single Phase Panels", "Three Phase Panelboards", "Meter Sockets", "Safety Switches", "AC Disconnects"].includes(sub)) return "panels";
    return "gear";
  }
  const lower = cat.toLowerCase();
  return ["conduit", "wire", "boxes", "fittings", "devices", "breakers", "panels", "lighting", "gear", "other"].includes(lower) ? lower : "other";
}

const UNIT: Record<string, string> = { RL: "ROLL", BX: "BOX", EA: "EA", FT: "FT", ROLL: "ROLL", BOX: "BOX", BAG: "BAG", SET: "SET", PAIR: "PAIR", LOT: "LOT", CT: "CT", PKG: "PKG" };
const BRANDS: [string, RegExp][] = [["Square D", /^Square D /i], ["Eaton", /^Eaton /i], ["Siemens", /^Siemens /i], ["Leviton", /^Leviton /i], ["Hubbell", /^Hubbell /i], ["Southwire", /^Southwire /i], ["Lutron", /^Lutron /i]];
const GENERIC = new Set(["wire", "cable", "fittings", "boxes", "devices", "hardware", "supports", "distribution", "connectors", "conduit", "lighting", "controls", "consumables", "low voltage", "grounding"]);

// Spanish words the field uses, added per subcategory (the CSV's own keywords are kept too).
const ES: Record<string, string[]> = {
  "Mud Rings": ["anillo", "aro", "anillo de yeso"], "Wall Plates": ["placa", "tapa"], Receptacles: ["tomacorriente", "enchufe"], Switches: ["apagador", "interruptor"],
  Dimmers: ["regulador de luz", "dimmer"], "Weatherproof Covers": ["tapa intemperie", "tapa exterior"], "Junction / Pull Boxes": ["caja de paso", "caja de registro"],
  "Square Steel Boxes": ["caja cuadrada"], "Device Boxes": ["caja de aparato", "caja de apagador"], "Steel Box Covers": ["tapa de caja"], "Weatherproof Boxes": ["caja intemperie"],
  "Masonry Boxes": ["caja de block"], "Handy Boxes": ["caja handy"], "Ceiling Boxes": ["caja de techo"], "Conduit Bodies": ["condulet", "cuerpo de conduit"],
  Reducers: ["reductor", "reduccion"], "Threaded Nipples": ["niple"], "Conduit Elbows": ["codo"], "Conduit Straps": ["abrazadera", "grapa"], "Strut Clamps": ["abrazadera strut", "clamp strut"],
  "Rod Hardware": ["varilla roscada", "tornilleria"], "Threaded Rod": ["varilla roscada"], "Strut Channel": ["canal strut", "unistrut"], Screws: ["tornillo"], Anchors: ["ancla", "taquete"],
  "Compression Lugs": ["zapata", "terminal"], "Split Bolts": ["conector split bolt", "tornillo partido"], "Twist-On Connectors": ["conector wirenut", "capuchon"], "Lever Connectors": ["conector palanca"],
  "Insulated Multi-Tap": ["conector multiple", "bloque"], "Thermal Magnetic Breakers": ["breaker", "interruptor termomagnetico", "pastilla"], "Protected Breakers": ["breaker", "interruptor protegido"],
  "Safety Switches": ["desconectador", "interruptor de seguridad"], Fuses: ["fusible"], "Single Phase Panels": ["panel", "tablero", "centro de carga"], "Three Phase Panelboards": ["panel trifasico", "tablero trifasico"],
  "Meter Sockets": ["base de medidor", "caja de medidor"], "Cable Ties": ["cincho", "cinta plastica"], "Electrical Tape": ["cinta aislante", "cinta electrica"], "Pulling Line": ["soga", "guia"],
  Firestop: ["sellador contra fuego"], "Installation Supplies": ["insumos"], Photocells: ["fotocelda", "fotocelula"], Timers: ["temporizador", "timer"], "Wall Sensors": ["sensor de pared", "sensor de presencia"],
  "Ceiling Sensors": ["sensor de techo", "sensor de presencia"], "Lighting Contactors": ["contactor de iluminacion"], "Bare Copper": ["cobre desnudo", "tierra desnuda"], "Ground Clamps": ["abrazadera de tierra"],
  "Ground Rods": ["varilla de tierra", "varilla copperweld"], "Data Cable": ["cable de red", "cable de datos"], "Data Devices": ["jack de red", "conector de red"], "Fire Alarm Cable": ["cable alarma de incendio"],
  "Flexible Cord": ["cordon", "extension"], "Flexible Conduit": ["flex", "tubo flexible", "greenfield"], EMT: ["tubo emt"], PVC: ["tubo pvc"], "Rigid / IMC": ["tubo rigido"],
  "Cable Connectors": ["conector de cable"], "Commercial Interior": ["luminaria comercial"], "Commercial Fixtures": ["luminaria comercial"], "Residential Interior": ["luminaria residencial"], "Life Safety": ["luz de emergencia", "salida"],
};

/** Same input always gives the same id (used only when the file has no id column), so loading the file again updates instead of duplicating. */
function stableId(text: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x7f4a7c15;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); h3 = Math.imul(h3 ^ c, 2246822519); h4 = Math.imul(h4 ^ c, 3266489917);
  }
  const hex = [h1, h2, h3, h4].map((n) => (n >>> 0).toString(16).padStart(8, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCatalogCsv(text: string): CatalogParse {
  const table = parseDelimited(text);
  const problems: string[] = [];
  if (table.length < 2) return { rows: [], skipped: 0, problems: ["empty"], byCategory: {} };
  const header = table[0].map((h) => normalizeText(h).replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const iName = col("name") >= 0 ? col("name") : col("description");
  if (iName < 0) return { rows: [], skipped: 0, problems: ["no_name_column"], byCategory: {} };
  const iId = col("id"), iCat = col("category"), iSub = col("subcategory"), iShort = col("short_description"), iUnit = col("unit"), iKw = col("keywords"), iAct = col("active");

  const rows: CatalogRow[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  const byCategory: Record<string, number> = {};
  for (const r of table.slice(1)) {
    const get = (i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
    const name = get(iName).slice(0, 300);
    if (!name || (iAct >= 0 && ["false", "0", "no", "n"].includes(get(iAct).toLowerCase()))) { skipped++; continue; }
    const rawId = get(iId);
    const id = UUID.test(rawId) ? rawId.toLowerCase() : stableId(rawId || normalizeText(name));
    if (seen.has(id)) { skipped++; continue; }
    seen.add(id);
    const sub = get(iSub);
    const category = appCategory(get(iCat), sub);
    let keywords: string[] = [];
    const rawKw = get(iKw);
    if (rawKw) {
      try { const parsed = JSON.parse(rawKw); if (Array.isArray(parsed)) keywords = parsed.map(String); } catch { keywords = rawKw.split(/[|;]/); }
    }
    const aliases: string[] = [];
    const used = new Set([name.toLowerCase()]);
    for (const k0 of [...keywords, ...(ES[sub] ?? []), get(iShort)]) {
      const k = k0.trim().toLowerCase();
      if (!k || used.has(k) || GENERIC.has(k) || (k === sub.toLowerCase() && !k.includes(" "))) continue;
      used.add(k); aliases.push(k.slice(0, 80));
      if (aliases.length >= 12) break;
    }
    const brand = BRANDS.find(([, re]) => re.test(name))?.[0] ?? null;
    rows.push({
      id, name, unit: UNIT[get(iUnit).toUpperCase()] ?? "EA", category, manufacturer: brand, aliases,
      search_text: [name, ...aliases].map(canonicalText).join(" | "),
    });
    byCategory[category] = (byCategory[category] ?? 0) + 1;
    if (rows.length >= MAX_CATALOG_ROWS) { problems.push("too_many_rows"); break; }
  }
  return { rows, skipped, problems, byCategory };
}
