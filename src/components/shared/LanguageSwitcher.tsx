"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { locales, localeNames, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact language menu: a small "ES" button that opens the list, so it never covers the content under it. */
export function LanguageSwitcher({ className, tone = "auto" }: { className?: string; tone?: "auto" | "dark" }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={box} className={cn("relative inline-block", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={localeNames[locale]}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
          tone === "dark" ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        )}
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        {locale.toUpperCase()}
      </button>
      {open && (
        <ul role="listbox" aria-label="Language" className="absolute right-0 top-full z-50 mt-1.5 min-w-[9rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                onClick={() => { setLocale(code as Locale); setOpen(false); }}
                className={cn("flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-slate-700 hover:bg-slate-50", locale === code && "font-semibold text-brand-700")}
              >
                {localeNames[code]}
                {locale === code && <Check className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
