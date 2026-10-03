"use client";

import { Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { getSiteContent, LEGAL_UPDATED } from "@/lib/site-content";
import { SiteShell, ContactCard } from "./SiteShell";
import { Prose } from "./Prose";

export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  const { locale } = useI18n();
  const c = getSiteContent(locale);
  const d = c[doc];
  const updated = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(LEGAL_UPDATED));
  return (
    <SiteShell wide>
      <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
        <nav aria-label={c.ui.onThisPage} className="mb-6 print:hidden lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{c.ui.onThisPage}</p>
          <ol className="space-y-1 text-sm">
            {d.sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="block rounded py-1 text-slate-600 hover:text-brand-700">{s.title}</a></li>)}
          </ol>
        </nav>
        <article className="max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{d.title}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            <span>{c.ui.updated}: {updated}</span>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 text-slate-500 underline print:hidden"><Printer className="h-3.5 w-3.5" />{c.ui.print}</button>
          </p>
          <aside className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <h2 className="mb-1 text-sm font-semibold text-brand-900">{d.summaryTitle}</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{d.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </aside>
          {d.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 pt-8">
              <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
              <Prose blocks={s.body} />
            </section>
          ))}
          <ContactCard />
        </article>
      </div>
    </SiteShell>
  );
}
