"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";
import { getSiteContent, LEGAL_ADDRESS, LEGAL_NAME, SUPPORT_EMAIL } from "@/lib/site-content";

/** Frame for the public pages (terms, privacy, help): readable without an account, safe-area aware, works on phone and desktop. */
export function SiteShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const { locale } = useI18n();
  const router = useRouter();
  const ui = getSiteContent(locale).ui;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} aria-label={ui.back}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link href="/" className="flex items-center gap-2" aria-label="BidPower"><Logo variant="mark" className="h-8 w-8" /><span className="hidden font-bold sm:inline">BidPower</span></Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 pb-16 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</main>
      <footer className="border-t border-slate-200 bg-white pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={ui.legalLinks} className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/help" className="hover:text-slate-800">{ui.help}</Link>
            <Link href="/terms" className="hover:text-slate-800">{ui.terms}</Link>
            <Link href="/privacy" className="hover:text-slate-800">{ui.privacy}</Link>
          </nav>
          <p>© {new Date().getFullYear()} {LEGAL_NAME || "BidPower"}. {ui.footerRights}</p>
        </div>
      </footer>
    </div>
  );
}

export function ContactCard() {
  const { locale } = useI18n();
  const ui = getSiteContent(locale).ui;
  return (
    <section aria-labelledby="contact" className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
      <h2 id="contact" className="mb-1 text-base font-semibold">{ui.contactTitle}</h2>
      <p className="mb-3 text-sm text-slate-600">{ui.contactBody}</p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-slate-400" />{ui.contactInApp}</li>
        {SUPPORT_EMAIL && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{ui.emailUs} <a className="font-medium text-brand-700 underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>}
      </ul>
      {(LEGAL_NAME || LEGAL_ADDRESS) && <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{ui.operator}: {[LEGAL_NAME, LEGAL_ADDRESS].filter(Boolean).join(" · ")}</p>}
    </section>
  );
}
