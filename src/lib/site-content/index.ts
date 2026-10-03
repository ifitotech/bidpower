import type { Locale } from "@/lib/i18n";
import es from "./es";
import en from "./en";
import pt from "./pt";
import type { SiteContent } from "./types";

export * from "./types";
const all: Record<Locale, SiteContent> = { es, en, pt };
export const getSiteContent = (locale: Locale): SiteContent => all[locale] ?? es;

/** The help topics keep this order in every language; the id text itself is translated. */
const TOPIC_ORDER = ["start", "home", "projects", "customers", "materials", "quotes", "purchasing", "expenses", "proposals", "invoices", "reports", "team", "suppliers", "supply", "takeoffs", "settings", "app"] as const;
const TOPIC_BY_PATH: [RegExp, (typeof TOPIC_ORDER)[number]][] = [
  [/^\/(dashboard|search|calendar)/, "home"],
  [/^\/projects\/[^/]+\/takeoff|^\/takeoffs/, "takeoffs"],
  [/^\/projects\/[^/]+\/materials|^\/materials|^\/material/, "materials"],
  [/^\/projects/, "projects"],
  [/^\/clients/, "customers"],
  [/^\/pricing/, "quotes"],
  [/^\/pos/, "purchasing"],
  [/^\/expenses/, "expenses"],
  [/^\/quotes/, "proposals"],
  [/^\/invoices/, "invoices"],
  [/^\/(reports|accounting)/, "reports"],
  [/^\/employees/, "team"],
  [/^\/suppliers/, "suppliers"],
  [/^\/supply/, "supply"],
  [/^\/(settings|feedback|more)/, "settings"],
];
/** Position (in the help list) of the topic that explains the screen at this path, or null. */
export function helpTopicIndexForPath(pathname: string): number | null {
  const hit = TOPIC_BY_PATH.find(([re]) => re.test(pathname));
  return hit ? TOPIC_ORDER.indexOf(hit[1]) : null;
}

/** Optional, set by the operator in the environment; shown on the public pages only when present. */
export const LEGAL_NAME = process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "";
export const LEGAL_ADDRESS = process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() || "";
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
