"use client";

import { confirmAsk } from "@/lib/confirm";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Plus, Star, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { MATERIAL_CATEGORIES, MATERIAL_UNITS, searchLibrary, type LibraryItem } from "@/lib/materials";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PricePoint } from "@/lib/services/materials";
import { IMPORT_TEMPLATE, MAX_IMPORT_ROWS, parseMaterialImport } from "@/lib/material-import";
import { readSheetText } from "@/lib/read-sheet";
import { catalogToLibrary } from "@/lib/catalog/types";
import { useCatalogSearch } from "@/lib/catalog/use-catalog-search";
import { deleteListsAction, archiveMaterialsAction, clearLibraryAction, addCatalogItemsAction, importMaterialsAction, getMaterialPricesAction, archiveMaterialAction, deleteListAction, saveMaterialAction, toggleFavoriteAction } from "./actions";

type Item = LibraryItem & { notes?: string | null; allow_substitution?: boolean };
type SavedList = { id: string; name: string; items: { materialId: string; quantity: number }[] };
type Draft = { id?: string; description: string; unit: string; category: string; manufacturer: string; catalog_number: string; aliases: string; notes: string; allow_substitution: boolean };
const EMPTY: Draft = { description: "", unit: "EA", category: "", manufacturer: "", catalog_number: "", aliases: "", notes: "", allow_substitution: false };

export default function MaterialsClient({ items, lists, error = false, canViewCosts = false }: { items: Item[]; lists: SavedList[]; error?: boolean; canViewCosts?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [alsoList, setAlsoList] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [listName, setListName] = useState("");
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("q")) setQuery(params.get("q") as string);
    if (params.get("import")) setImporting(true);
    if (params.get("add")) setDraft({ ...EMPTY });
  }, [params]);
  const preview = useMemo(() => (importText.trim() ? parseMaterialImport(importText) : null), [importText]);
  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  useEffect(() => {
    setPrices(null);
    if (!draft?.id || !canViewCosts) return;
    let live = true;
    getMaterialPricesAction(draft.id).then((r) => { if (live) setPrices(r.prices ?? []); }).catch(() => { if (live) setPrices([]); });
    return () => { live = false; };
  }, [draft?.id, canViewCosts]);
  // Standard-catalog suggestions for what is being searched (downloaded the first time somebody searches).
  const { items: catalog } = useCatalogSearch(query);
  const catalogMatches = useMemo(() => {
    if (query.trim().length < 2 || catalog.length === 0) return [];
    const own = new Set(items.map((i) => i.description.toLowerCase()));
    return searchLibrary(catalog.filter((c) => !own.has(c.n.toLowerCase())).map(catalogToLibrary), query, 6);
  }, [catalog, items, query]);
  // The library is a search box, not a long list: products appear only when something is typed.
  const shown = useMemo(() => (query.trim() ? searchLibrary(items, query, 60) : []), [items, query]);
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500";

  async function run(fn: () => Promise<{ errorCode?: string }>, done?: () => void) {
    setBusy(true); setMsg(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }));
    if (res.errorCode) setMsg(t(res.errorCode as keyof Dictionary)); else done?.();
    setBusy(false);
    router.refresh();
  }

  // Excel (.xlsx) is read in the browser and turned into the same tab-separated text the CSV path uses.
  async function loadFile(f: File) {
    setMsg(null);
    try { setImportText(await readSheetText(f)); if (!listName) setListName(f.name.replace(/\.[^.]+$/, "").slice(0, 120)); } catch (e) { setMsg(t(e instanceof Error && e.message === "xls" ? "importXlsOld" : "importXlsError")); }
  }

  const save = () => draft && run(() => saveMaterialAction({ ...draft, aliases: draft.aliases.split(",").map((a) => a.trim()).filter(Boolean) }), () => setDraft(null));
  const edit = (i: Item) => setDraft({ id: i.id, description: i.description, unit: i.unit, category: i.category ?? "", manufacturer: i.manufacturer ?? "", catalog_number: i.catalog_number ?? "", aliases: i.aliases.join(", "), notes: i.notes ?? "", allow_substitution: Boolean(i.allow_substitution) });
  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-3 min-w-0"><h1 className="text-xl font-bold">{t("materialsLibrary")}</h1><p className="text-sm text-slate-500">{t("materialsLibraryHint")}</p></div>
    <div className="mb-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => setDraft({ ...EMPTY })} className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />{t("addItem")}</button>
      {items.length > 0 && <button type="button" onClick={() => { setSelecting((v) => !v); setPicked(new Set()); }} aria-pressed={selecting} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold">{selecting ? t("libSelectDone") : t("libSelect")}</button>}
      {items.length > 0 && <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("libClearConfirm", { count: String(items.length) }))) run(async () => { const r = await clearLibraryAction(true); if (r.success) setNotice(t("libCleared", { count: String(r.archived ?? 0) })); return r; }); }} className="flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4" />{t("libClearAll")}</button>}
      <button type="button" onClick={() => setImporting((v) => !v)} className="flex min-h-11 items-center gap-2 rounded-xl border border-brand-500 px-4 text-sm font-semibold text-brand-700"><Upload className="h-4 w-4" />{t("importCsv")}</button>
    </div>
    {notice && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
    {(error || msg) && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error ? t("errLoadMaterials") : msg}</div>}
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className={`${input} mb-3`} />

    {catalogMatches.length > 0 && !draft && <section className="mb-3 rounded-xl border border-slate-200 bg-white" aria-label={t("catalogSection")}>
      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("catalogSection")}</p>
      <ul className="divide-y divide-slate-50">{catalogMatches.map((c) => <li key={c.id} className="flex min-h-12 items-center gap-2 px-4 py-1.5 text-sm"><span className="min-w-0 flex-1 truncate">{c.description}</span><button type="button" disabled={busy} onClick={() => run(async () => { const r = await addCatalogItemsAction([c.id.slice(4)]); if (r.success) setNotice(t("catalogAdded", { count: String(r.added ?? 0) })); return r; })} className="min-h-10 shrink-0 rounded-lg border border-brand-500 px-3 text-xs font-semibold text-brand-700 disabled:opacity-40">{t("catalogAddToLibrary")}</button></li>)}</ul>
    </section>}
    {query.trim().length >= 2 && !draft && <button type="button" onClick={() => setDraft({ ...EMPTY, description: query.trim() })} className="mb-3 flex min-h-11 w-full items-center gap-2 rounded-xl border border-dashed border-brand-500 px-4 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"><Plus className="h-4 w-4" />{t("mbCreateFromSearch", { text: query.trim() })}</button>}

    {importing && <div className="mb-4 space-y-3 rounded-xl border border-brand-500 bg-white p-4">
      <h2 className="font-semibold">{t("importCsv")}</h2>
      <p className="text-sm text-slate-500">{t("importHint")}</p>
      <div className="flex flex-wrap gap-2">
        <label className="flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold">{t("importChooseFile")}<input type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await loadFile(f); }} /></label>
        <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE)}`} download="bidpower-materials-template.csv" className="flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm">{t("importTemplate")}</a>
      </div>
      <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} aria-label={t("importPaste")} placeholder={t("importPaste")} className={input} />
      {preview && (preview.missingDescription
        ? <p role="alert" className="text-sm text-red-600">{t("importNoDescription")}</p>
        : <div className="text-sm"><p className="font-medium">{t("importPreview", { count: String(preview.rows.length) })}{preview.rows.length >= MAX_IMPORT_ROWS ? ` · ${t("importTooMany")}` : ""}</p>{preview.invalid > 0 && <p className="text-xs text-amber-700">{t("importInvalid", { count: String(preview.invalid) })}</p>}<ul className="mt-1 space-y-0.5 text-xs text-slate-500">{preview.rows.slice(0, 5).map((r, k) => <li key={k} className="truncate">{r.quantity ? `${r.quantity} × ` : ""}{r.catalog_number ? `${r.catalog_number} · ` : ""}{r.description}{r.aliases.length ? ` (${r.aliases.join(", ")})` : ""}</li>)}</ul></div>)}
      {preview && !preview.missingDescription && preview.rows.length > 0 && <div className="rounded-lg bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={alsoList} onChange={(e) => setAlsoList(e.target.checked)} />{t("importAlsoList")}</label>
        {alsoList && <input value={listName} maxLength={120} onChange={(e) => setListName(e.target.value)} placeholder={t("importListNamePh")} aria-label={t("importListNamePh")} className={`${input} mt-2`} />}
      </div>}
      <div className="flex gap-2"><button type="button" disabled={busy || !preview || preview.rows.length === 0 || (alsoList && !listName.trim())} onClick={() => run(async () => { const r = await importMaterialsAction(importText, alsoList ? listName : undefined); if (r.success) setNotice(t("importDone", { created: String(r.created ?? 0), skipped: String(r.skipped ?? 0) }) + (r.listItems ? ` ${t("importListSaved", { name: listName.trim(), count: String(r.listItems) })}` : "")); return r; }, () => { setImportText(""); setImporting(false); })} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("importRun")}</button><button type="button" onClick={() => { setImporting(false); setImportText(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm">{t("cancel")}</button></div>
    </div>}

    {draft && <div className="mb-4 space-y-3 rounded-xl border border-brand-500 bg-white p-4">
      <h2 className="font-semibold">{draft.id ? t("editItem") : t("addItem")}</h2>
      <label className="block text-sm font-medium">{t("itemDescription")}<input value={draft.description} maxLength={300} onChange={(e) => set({ description: e.target.value })} className={`${input} mt-1`} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">{t("itemUnit")}<select value={draft.unit} onChange={(e) => set({ unit: e.target.value })} className={`${input} mt-1`}>{MATERIAL_UNITS.map((u) => <option key={u}>{u}</option>)}</select></label>
        <label className="block text-sm font-medium">{t("itemCategory")}<select value={draft.category} onChange={(e) => set({ category: e.target.value })} className={`${input} mt-1`}><option value="" />{MATERIAL_CATEGORIES.map((c) => <option key={c.code} value={c.code}>{t(c.key)}</option>)}</select></label>
        <label className="block text-sm font-medium">{t("itemManufacturer")}<input value={draft.manufacturer} onChange={(e) => set({ manufacturer: e.target.value })} className={`${input} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("itemCatalog")}<input value={draft.catalog_number} onChange={(e) => set({ catalog_number: e.target.value })} className={`${input} mt-1`} /></label>
      </div>
      <label className="block text-sm font-medium">{t("itemAliases")}<input value={draft.aliases} placeholder={t("itemAliasesHint")} onChange={(e) => set({ aliases: e.target.value })} className={`${input} mt-1`} /></label>
      <label className="block text-sm font-medium">{t("itemNotes")}<input value={draft.notes} onChange={(e) => set({ notes: e.target.value })} className={`${input} mt-1`} /></label>
      {draft.id && canViewCosts && <section className="rounded-lg bg-slate-50 p-3 text-sm"><h3 className="mb-1 font-semibold">{t("priceHistory")}</h3>{prices === null ? <p className="text-slate-400">{t("loading")}</p> : prices.length === 0 ? <p className="text-slate-500">{t("priceHistoryEmpty")}</p> : <><p className="mb-1 text-xs font-medium text-green-700">{t("priceLowest", { price: formatCurrency(Math.min(...prices.map((p) => p.price))), vendor: prices.reduce((a, b) => (b.price < a.price ? b : a)).vendor })}</p><ul className="space-y-0.5">{prices.map((p, k) => <li key={k} className="flex justify-between gap-2 text-xs"><span className="min-w-0 truncate">{p.vendor} · {p.source === "po" ? t("priceFromPO") : t("priceFromQuote")} · {formatDate(p.date)}</span><strong>{formatCurrency(p.price)}</strong></li>)}</ul></>}</section>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.allow_substitution} onChange={(e) => set({ allow_substitution: e.target.checked })} />{t("allowSubstitution")}</label>
      <div className="flex gap-2"><button type="button" disabled={busy || !draft.description.trim()} onClick={save} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("save")}</button><button type="button" onClick={() => setDraft(null)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold">{t("cancel")}</button></div>
    </div>}

    {selecting && <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-brand-500 bg-brand-50 p-2">
      <button type="button" onClick={() => setPicked(new Set(shown.map((i) => i.id)))} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold">{t("libSelectAll", { count: String(shown.length) })}</button>
      <button type="button" onClick={() => setPicked(new Set())} className="min-h-10 rounded-lg px-3 text-xs font-medium text-slate-600">{t("libSelectNone")}</button>
      <button type="button" disabled={busy || picked.size === 0} onClick={async () => { if (await confirmAsk(t("libArchiveSelectedConfirm", { count: String(picked.size) }))) run(async () => { const r = await archiveMaterialsAction([...picked]); if (r.success) setNotice(t("libArchived", { count: String(r.archived ?? 0) })); return r; }, () => setPicked(new Set())); }} className="ml-auto min-h-10 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-40">{t("libArchiveSelected", { count: String(picked.size) })}</button>
    </div>}
    {!error && items.length > 0 && !query.trim() && <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center"><p className="font-semibold">{t("libTypeToSearch")}</p><p className="mt-1 text-sm text-slate-500">{t("libCount", { count: String(items.length) })}</p></div>}
    {!error && items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="font-semibold">{t("noItemsYet")}</p><p className="mt-1 text-sm text-slate-500">{t("noItemsYetHint")}</p></div> : shown.length === 0 ? null :
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{shown.map((i) => <li key={i.id} className="flex items-center gap-2 px-3 py-2">
        {selecting && <input type="checkbox" aria-label={i.description} checked={picked.has(i.id)} onChange={(e) => setPicked((prev) => { const n = new Set(prev); if (e.target.checked) n.add(i.id); else n.delete(i.id); return n; })} className="h-5 w-5 shrink-0" />}
        <button type="button" disabled={busy} aria-label={t("favorite")} aria-pressed={i.is_favorite} onClick={() => run(() => toggleFavoriteAction(i.id, !i.is_favorite))} className="flex h-10 w-10 shrink-0 items-center justify-center"><Star className={`h-4 w-4 ${i.is_favorite ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>
        <button type="button" onClick={() => edit(i)} className="min-w-0 flex-1 py-1 text-left"><p className="truncate text-sm font-medium">{i.description}</p><p className="truncate text-xs text-slate-400">{i.catalog_number ? `${t("partNumberShort")} ${i.catalog_number} · ` : ""}{i.unit}{i.aliases.length ? ` · ${i.aliases.join(", ")}` : ""}</p></button>
        <button type="button" disabled={busy} aria-label={t("archiveItem")} onClick={async () => { if (await confirmAsk(t("confirmArchiveItem"))) run(() => archiveMaterialAction(i.id)); }} className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
      </li>)}</ul>}

    {lists.length > 0 && <section className="mt-6"><div className="mb-2 flex items-center gap-2"><h2 className="flex-1 font-semibold">{t("savedLists")}</h2>{lists.length > 1 && <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("listsDeleteAllConfirm", { count: String(lists.length) }))) run(async () => { const r = await deleteListsAction(null); if (r.success) setNotice(t("listsDeleted", { count: String(r.deleted ?? 0) })); return r; }); }} className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 disabled:opacity-40">{t("listsDeleteAll")}</button>}</div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{lists.map((l) => <li key={l.id} className="px-4 py-1 text-sm"><details className="group"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2"><span className="min-w-0 flex-1 truncate font-medium">{l.name}</span><span className="text-xs text-slate-400">{t("itemsCount", { count: String(l.items.length) })}</span>
        <button type="button" disabled={busy} aria-label={t("delete")} onClick={async (e) => { e.preventDefault(); if (await confirmAsk(t("delete") + "?")) run(() => deleteListAction(l.id)); }} className="flex h-10 w-10 items-center justify-center text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></summary>
        <ul className="mb-2 ml-1 space-y-0.5 border-l border-slate-200 pl-3 text-xs text-slate-600">{l.items.map((e, k) => { const m = items.find((x) => x.id === e.materialId); return <li key={k} className="flex gap-2"><span className="w-10 shrink-0 text-right font-semibold">{e.quantity}</span><span className="min-w-0 truncate">{m?.description ?? "—"}</span></li>; })}</ul></details></li>)}</ul></section>}
  </div>;
}
