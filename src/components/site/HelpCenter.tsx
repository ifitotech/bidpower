"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { getSiteContent } from "@/lib/site-content";
import { SiteShell, ContactCard } from "./SiteShell";
import { Prose } from "./Prose";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function HelpCenter() {
  const { locale } = useI18n();
  const c = getSiteContent(locale);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // /help#article-id opens that answer and scrolls to it.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      setOpenId(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 50);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  const words = norm(query).split(/\s+/).filter(Boolean);

  const topics = useMemo(() => c.help
    .filter((t) => !topic || t.id === topic)
    .map((t) => ({
      ...t,
      articles: t.articles.filter((a) => !words.length || words.every((w) => norm(`${a.q} ${a.a.join(" ")} ${a.keywords ?? ""}`).includes(w))),
    }))
    .filter((t) => t.articles.length > 0), [c, topic, query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SiteShell>
      <h1 className="text-2xl font-bold sm:text-3xl">{c.ui.helpTitle}</h1>
      <p className="mt-1 text-slate-600">{c.ui.helpIntro}</p>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.ui.searchPh} aria-label={c.ui.searchPh}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={c.ui.topics}>
        <button type="button" onClick={() => setTopic(null)} aria-pressed={!topic} className={`rounded-full border px-3 py-1.5 text-sm ${!topic ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{c.ui.topics}</button>
        {c.help.map((t) => <button key={t.id} type="button" onClick={() => setTopic(topic === t.id ? null : t.id)} aria-pressed={topic === t.id} className={`rounded-full border px-3 py-1.5 text-sm ${topic === t.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{t.title}</button>)}
      </div>

      {!words.length && !topic && (
        <section aria-labelledby="start" className="mt-8 rounded-xl border border-brand-100 bg-brand-50 p-5">
          <h2 id="start" className="mb-3 text-base font-semibold text-brand-900">{c.ui.startTitle}</h2>
          <ol className="space-y-2">
            {c.ui.startSteps.map((s, i) => <li key={i} className="flex gap-3 text-sm text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span><span>{s}</span></li>)}
          </ol>
        </section>
      )}

      {topics.length === 0 && <p role="status" className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">{c.ui.noResults}</p>}
      {topics.map((t) => (
        <section key={t.id} id={t.id} aria-labelledby={`h-${t.id}`} className="mt-8 scroll-mt-20">
          <h2 id={`h-${t.id}`} className="text-lg font-semibold">{t.title}</h2>
          <p className="mb-3 text-sm text-slate-500">{t.blurb}</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {t.articles.map((a) => (
              <details key={a.id} id={a.id} className="group scroll-mt-20 px-4 py-3" open={openId === a.id || (words.length > 0 && t.articles.length <= 3)} onToggle={(e) => { const el = e.currentTarget; if (el.open) setOpenId(a.id); else if (openId === a.id) setOpenId(null); }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-slate-900">
                  <span>{a.q}</span><span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <div className="pt-1"><Prose blocks={a.a} /></div>
              </details>
            ))}
          </div>
        </section>
      ))}
      <ContactCard />
    </SiteShell>
  );
}
