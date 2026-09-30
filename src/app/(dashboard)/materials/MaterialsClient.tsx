"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { MATERIAL_CATEGORIES, MATERIAL_UNITS, searchLibrary, type LibraryItem } from "@/lib/materials";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PricePoint } from "@/lib/services/materials";
import { getMaterialPricesAction, archiveMaterialAction, deleteListAction, saveMaterialAction, toggleFavoriteAction } from "./actions";

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
  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  useEffect(() => {
    setPrices(null);
    if (!draft?.id || !canViewCosts) return;
    let live = true;
    getMaterialPricesAction(draft.id).then((r) => { if (live) setPrices(r.prices ?? []); }).catch(() => { if (live) setPrices([]); });
    return () => { live = false; };
  }, [draft?.id, canViewCosts]);
  const shown = useMemo(() => searchLibrary(items, query, query ? 60 : 200), [items, query]);
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500";

  async function run(fn: () => Promise<{ errorCode?: string }>, done?: () => void) {
    setBusy(true); setMsg(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }));
    if (res.errorCode) setMsg(t(res.errorCode as keyof Dictionary)); else done?.();
    setBusy(false);
    router.refresh();
  }

  const save = () => draft && run(() => saveMaterialAction({ ...draft, aliases: draft.aliases.split(",").map((a) => a.trim()).filter(Boolean) }), () => setDraft(null));
  const edit = (i: Item) => setDraft({ id: i.id, description: i.description, unit: i.unit, category: i.category ?? "", manufacturer: i.manufacturer ?? "", catalog_number: i.catalog_number ?? "", aliases: i.aliases.join(", "), notes: i.notes ?? "", allow_substitution: Boolean(i.allow_substitution) });
  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-4 flex items-start gap-3">
      <div className="min-w-0 flex-1"><h1 className="text-xl font-bold">{t("materialsLibrary")}</h1><p className="text-sm text-slate-500">{t("materialsLibraryHint")}</p></div>
      <button type="button" onClick={() => setDraft({ ...EMPTY })} className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("addItem")}</span></button>
    </div>
    {(error || msg) && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error ? t("errLoadMaterials") : msg}</div>}
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className={`${input} mb-3`} />

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

    {!error && items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="font-semibold">{t("noItemsYet")}</p><p className="mt-1 text-sm text-slate-500">{t("noItemsYetHint")}</p></div> :
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{shown.map((i) => <li key={i.id} className="flex items-center gap-2 px-3 py-2">
        <button type="button" disabled={busy} aria-label={t("favorite")} aria-pressed={i.is_favorite} onClick={() => run(() => toggleFavoriteAction(i.id, !i.is_favorite))} className="flex h-10 w-10 shrink-0 items-center justify-center"><Star className={`h-4 w-4 ${i.is_favorite ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>
        <button type="button" onClick={() => edit(i)} className="min-w-0 flex-1 py-1 text-left"><p className="truncate text-sm font-medium">{i.description}</p><p className="truncate text-xs text-slate-400">{i.unit}{i.aliases.length ? ` · ${i.aliases.join(", ")}` : ""}</p></button>
        <button type="button" disabled={busy} aria-label={t("archiveItem")} onClick={() => { if (window.confirm(t("confirmArchiveItem"))) run(() => archiveMaterialAction(i.id)); }} className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
      </li>)}</ul>}

    {lists.length > 0 && <section className="mt-6"><h2 className="mb-2 font-semibold">{t("savedLists")}</h2>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{lists.map((l) => <li key={l.id} className="flex items-center gap-2 px-4 py-2 text-sm"><span className="min-w-0 flex-1 truncate font-medium">{l.name}</span><span className="text-xs text-slate-400">{t("itemsCount", { count: String(l.items.length) })}</span>
        <button type="button" disabled={busy} aria-label={t("delete")} onClick={() => { if (window.confirm(t("delete") + "?")) run(() => deleteListAction(l.id)); }} className="flex h-10 w-10 items-center justify-center text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></li>)}</ul></section>}
  </div>;
}
