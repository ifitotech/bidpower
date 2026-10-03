"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { getSiteContent } from "@/lib/site-content";

/** Terms / privacy / help links for screens outside the app shell. `dark` is for the blue sign-in screens. */
export function LegalLinks({ tone = "light", accept = false, className = "" }: { tone?: "light" | "dark"; accept?: boolean; className?: string }) {
  const { locale } = useI18n();
  const ui = getSiteContent(locale).ui;
  const link = tone === "dark" ? "text-white/90 underline underline-offset-2" : "text-slate-500 underline underline-offset-2";
  return (
    <p className={`text-xs leading-relaxed ${tone === "dark" ? "text-brand-300" : "text-slate-400"} ${className}`}>
      {accept && <>{ui.acceptNote} </>}
      <Link href="/terms" className={link}>{ui.terms}</Link>
      {accept ? " · " : " · "}
      <Link href="/privacy" className={link}>{ui.privacy}</Link>
      {" · "}
      <Link href="/help" className={link}>{ui.help}</Link>
    </p>
  );
}
