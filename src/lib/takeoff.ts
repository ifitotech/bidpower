// Electrical takeoff (Phase 8): pure helpers. Nothing here reads plans or guesses:
// it only adds up what a person counted or measured. Every result is PRELIMINARY until verified.

export const TAKEOFF_CATEGORIES = [
  { code: "lighting", key: "tkCatLighting", materialCategory: "lighting" },
  { code: "devices", key: "tkCatDevices", materialCategory: "devices" },
  { code: "gear", key: "tkCatGear", materialCategory: "gear" },
  { code: "other", key: "tkCatOther", materialCategory: "other" },
] as const;
export type TakeoffCategory = (typeof TAKEOFF_CATEGORIES)[number]["code"];

export type TakeoffCount = { category: string; label: string; quantity: number };
export type TakeoffCircuit = { circuit_no: string; breaker_amps: number; poles: number };
export type TakeoffPanel = { name: string; voltage: string | null; phases: number; bus_amps: number | null; main_breaker_amps: number | null; circuits: TakeoffCircuit[] };
export type TakeoffFeeder = {
  name: string; length_ft: number; conductor_size: string | null; conductors: number | null; ground_size: string | null; conduit_size: string | null; conduit_type: string | null;
};

export type DerivedLine = {
  key: string; description: string; quantity: number; unit: "EA" | "FT"; category: string;
  /** Human-readable explanation of where the number comes from (shown next to the line). */
  basis: string;
};
export type DerivedNote = { code: "feederIncomplete" | "noBranchWire" | "noFittings"; params?: Record<string, string> };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adds up the takeoff into a preliminary material list.
 *  - counts pass through (same label = summed)
 *  - breakers: one per circuit by size and poles, plus each panel's main breaker (2-pole single phase, 3-pole three phase)
 *  - panels: one per panel
 *  - feeders: wire = length x conductors, ground = length, conduit = length; each with the waste factor, rounded up to whole feet
 * Branch-circuit wire/conduit, boxes and fittings are NOT estimated: they need measured lengths, so a note says so.
 */
export function deriveMaterials(input: { counts: TakeoffCount[]; panels: TakeoffPanel[]; feeders: TakeoffFeeder[]; wastePct: number }): { lines: DerivedLine[]; notes: DerivedNote[] } {
  const waste = 1 + Math.max(0, Math.min(100, input.wastePct)) / 100;
  const map = new Map<string, DerivedLine>();
  const notes: DerivedNote[] = [];
  const add = (line: Omit<DerivedLine, "basis">, basis: string) => {
    const cur = map.get(line.key);
    if (cur) { cur.quantity = round2(cur.quantity + line.quantity); cur.basis = `${cur.basis}; ${basis}`; }
    else map.set(line.key, { ...line, basis });
  };

  for (const c of input.counts) {
    const label = clean(c.label);
    if (!label || !(c.quantity > 0)) continue;
    const cat = TAKEOFF_CATEGORIES.find((x) => x.code === c.category)?.materialCategory ?? "other";
    add({ key: `count|${cat}|${norm(label)}`, description: label, quantity: c.quantity, unit: "EA", category: cat }, `count ${c.quantity}`);
  }

  for (const p of input.panels) {
    const name = clean(p.name);
    if (!name) continue;
    const desc = `Panel ${name}${p.bus_amps ? ` ${p.bus_amps}A` : ""}${clean(p.voltage) ? ` ${clean(p.voltage)}` : ""} ${p.phases === 3 ? "3-phase" : "1-phase"}`;
    add({ key: `panel|${norm(desc)}`, description: desc, quantity: 1, unit: "EA", category: "panels" }, `panel ${name}`);
    for (const c of p.circuits) {
      if (!(c.breaker_amps > 0)) continue;
      add({ key: `breaker|${c.breaker_amps}|${c.poles}`, description: `${c.breaker_amps}A ${c.poles}-pole breaker`, quantity: 1, unit: "EA", category: "breakers" }, `${name} circuit ${clean(c.circuit_no)}`);
    }
    if (p.main_breaker_amps && p.main_breaker_amps > 0) {
      const poles = p.phases === 3 ? 3 : 2;
      add({ key: `breaker|${p.main_breaker_amps}|${poles}`, description: `${p.main_breaker_amps}A ${poles}-pole breaker`, quantity: 1, unit: "EA", category: "breakers" }, `${name} main (${p.phases === 3 ? "3-phase" : "single phase"} → ${poles}-pole)`);
    }
  }
  if (input.panels.length > 0) notes.push({ code: "noBranchWire" });

  for (const f of input.feeders) {
    const len = Number(f.length_ft);
    if (!(len > 0)) continue;
    const size = clean(f.conductor_size);
    let complete = true;
    if (size && f.conductors && f.conductors > 0) {
      const qty = Math.ceil(len * f.conductors * waste);
      add({ key: `wire|${norm(size)}`, description: `${size} conductor`, quantity: qty, unit: "FT", category: "wire" }, `${f.name}: ${len} ft × ${f.conductors}`);
    } else complete = false;
    const ground = clean(f.ground_size);
    if (ground) add({ key: `wire|ground|${norm(ground)}`, description: `${ground} ground conductor`, quantity: Math.ceil(len * waste), unit: "FT", category: "wire" }, `${f.name}: ${len} ft`);
    const conduit = clean(f.conduit_size);
    if (conduit) {
      const type = clean(f.conduit_type);
      add({ key: `conduit|${norm(conduit)}|${norm(type)}`, description: `${conduit}${type ? ` ${type}` : ""} conduit`, quantity: Math.ceil(len * waste), unit: "FT", category: "conduit" }, `${f.name}: ${len} ft`);
    } else complete = false;
    if (!complete) notes.push({ code: "feederIncomplete", params: { name: clean(f.name) } });
  }
  if (input.counts.length > 0 || input.panels.length > 0 || input.feeders.length > 0) notes.push({ code: "noFittings" });

  const order = ["panels", "breakers", "wire", "conduit", "gear", "lighting", "devices", "boxes", "fittings", "other"];
  const lines = [...map.values()].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.description.localeCompare(b.description));
  return { lines, notes };
}

/** Totals for the summary strip. */
export function takeoffTotals(counts: TakeoffCount[], panels: TakeoffPanel[], feeders: TakeoffFeeder[]) {
  return {
    fixtures: counts.filter((c) => c.category === "lighting").reduce((s, c) => s + c.quantity, 0),
    devices: counts.filter((c) => c.category === "devices").reduce((s, c) => s + c.quantity, 0),
    panels: panels.length,
    circuits: panels.reduce((s, p) => s + p.circuits.length, 0),
    feederFeet: round2(feeders.reduce((s, f) => s + Number(f.length_ft || 0), 0)),
  };
}
