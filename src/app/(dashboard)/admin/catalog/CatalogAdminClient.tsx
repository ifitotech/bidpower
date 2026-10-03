"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { parseCatalogCsv } from "@/lib/catalog/build";
import { readSheetText } from "@/lib/read-sheet";
import { catalogImportAction, catalogPruneAction } from "./actions";

const CHUNK = 300;

export default function CatalogAdminClient({ count }: { count: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [prune, setPrune] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const parsed = useMemo(() => (text ? parseCatalogCsv(text) : null), [text]);

  async function pick(f: File) {
    setMessage(null); setProgress(0); setFileName(f.name);
    try { setText(await readSheetText(f)); } catch { setText(""); setMessage({ kind: "error", text: t("importXlsError") }); }
  }

  async function run() {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true); setMessage(null); setProgress(0);
    const batch = crypto.randomUUID();
    let done = 0;
    for (let i = 0; i < parsed.rows.length; i += CHUNK) {
      const res = await catalogImportAction(parsed.rows.slice(i, i + CHUNK), batch).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; saved?: number }));
      if (res.errorCode) { setMessage({ kind: "error", text: t(res.errorCode as keyof Dictionary) }); setBusy(false); return; }
      done += parsed.rows.slice(i, i + CHUNK).length;
      setProgress(Math.round((done / parsed.rows.length) * 100));
    }
    let hidden = 0;
    if (prune) { const r = await catalogPruneAction(batch).catch(() => ({ hidden: 0 })); hidden = r.hidden ?? 0; }
    setMessage({ kind: "ok", text: t("adminCatalogDone", { count: String(parsed.rows.length), hidden: String(hidden) }) });
    setBusy(false);
    router.refresh();
  }

  return <div className="mx-auto max-w-2xl p-4 md:p-8">
    <h1 className="text-xl font-bold">{t("adminCatalogTitle")}</h1>
    <p className="mt-1 text-sm text-slate-500">{t("adminCatalogHint")}</p>
    <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm"><span className="font-semibold">{t("adminCatalogCurrent")}:</span> {count}</p>

    <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-brand-500 px-4 text-sm font-semibold text-brand-700">
      {t("importChooseFile")}
      <input type="file" aria-label={t("importChooseFile")} accept=".csv,.tsv,.txt,.xlsx,text/csv,text/plain" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await pick(f); }} />
    </label>
    {fileName && <p className="mt-1 text-xs text-slate-500">{fileName}</p>}

    {parsed && (parsed.rows.length === 0
      ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{t("importNoDescription")}</p>
      : <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <p className="font-semibold">{t("adminCatalogReady", { count: String(parsed.rows.length) })}{parsed.skipped > 0 ? ` · ${t("adminCatalogSkipped", { count: String(parsed.skipped) })}` : ""}</p>
        <p className="mt-1 text-xs text-slate-500">{Object.entries(parsed.byCategory).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}: ${n}`).join(" · ")}</p>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={prune} onChange={(e) => setPrune(e.target.checked)} />{t("adminCatalogPrune")}</label>
        <button type="button" disabled={busy} onClick={run} className="mt-3 min-h-12 w-full rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-40">{busy ? `${t("adminCatalogLoading")} ${progress}%` : t("adminCatalogLoad")}</button>
        {busy && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>}
      </div>)}
    {message && <p role={message.kind === "error" ? "alert" : "status"} className={`mt-3 rounded-xl border p-3 text-sm ${message.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>{message.text}</p>}
  </div>;
}
