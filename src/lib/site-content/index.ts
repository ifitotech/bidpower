import type { Locale } from "@/lib/i18n";
import es from "./es";
import en from "./en";
import pt from "./pt";
import type { SiteContent } from "./types";

export * from "./types";
const all: Record<Locale, SiteContent> = { es, en, pt };
export const getSiteContent = (locale: Locale): SiteContent => all[locale] ?? es;

/** Optional, set by the operator in the environment; shown on the public pages only when present. */
export const LEGAL_NAME = process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "";
export const LEGAL_ADDRESS = process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() || "";
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
