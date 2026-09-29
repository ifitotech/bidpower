// Pricing Request (Phase 4): shared constants and pure helpers.

export const PRICING_TYPES = [
  { code: "material", key: "prTypeMaterial" },
  { code: "gear", key: "prTypeGear" },
  { code: "lighting", key: "prTypeLighting" },
  { code: "other", key: "prTypeOther" },
] as const;
export const PRICING_TYPE_CODES: readonly string[] = PRICING_TYPES.map((t) => t.code);

export const AVAILABILITY = ["available", "partial", "unavailable"] as const;
export type Availability = (typeof AVAILABILITY)[number];

/** Statuses the app moves a Pricing Request through. Others in the DB check list are reserved for later phases. */
export const PRICING_STATUS_KEYS: Record<string, string> = {
  draft: "prStatusDraft", sent: "prStatusSent", question_open: "prStatusQuestion", responded: "prStatusResponded",
  awarded: "prStatusAwarded", converted_to_po: "prStatusPO", closed: "prStatusClosed", cancelled: "reqStatusCancelled",
};

export type PricingLink = { label: string; url: string };

/** Keeps only http(s) links (no javascript: or data: URLs), trimmed and capped. */
export function cleanLinks(input: unknown, max = 10): PricingLink[] {
  if (!Array.isArray(input)) return [];
  const out: PricingLink[] = [];
  for (const raw of input) {
    if (out.length >= max) break;
    const url = String((raw as PricingLink)?.url ?? "").trim();
    if (!/^https?:\/\/[^\s]+$/i.test(url) || url.length > 500) continue;
    const label = String((raw as PricingLink)?.label ?? "").trim().slice(0, 80);
    out.push({ label: label || url.replace(/^https?:\/\//i, "").slice(0, 60), url });
  }
  return out;
}

export type ResponseLine = { requestItemId: string; quantity: number; unitPrice: number | null; availability: Availability | null; leadTime: string | null };

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Sum of priced lines only. Lines without a price do not count as zero-cost. */
export function linesSubtotal(lines: ResponseLine[]): number {
  return round2(lines.reduce((sum, l) => sum + (l.unitPrice != null && l.availability !== "unavailable" ? l.unitPrice * l.quantity : 0), 0));
}

/** Total to store: the supplier's own quote total if given, otherwise subtotal + freight + tax. */
export function responseTotal(lines: ResponseLine[], freight: number | null, tax: number | null, quoted: number | null): number | null {
  if (quoted != null) return round2(quoted);
  const sub = linesSubtotal(lines);
  if (sub === 0 && freight == null && tax == null) return null;
  return round2(sub + (freight ?? 0) + (tax ?? 0));
}

/** Per request line, the cheapest available unit price across responses (for the comparison highlight). */
export function bestPriceByLine(responses: { lines: { requestItemId: string; unitPrice: number | null; availability: string | null }[] }[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const r of responses) {
    for (const l of r.lines) {
      if (l.unitPrice == null || l.availability === "unavailable") continue;
      const cur = best.get(l.requestItemId);
      if (cur == null || l.unitPrice < cur) best.set(l.requestItemId, l.unitPrice);
    }
  }
  return best;
}
