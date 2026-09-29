"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, ListChecks, Minus, Plus, Search, Star, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { MATERIAL_UNITS, findExact, normalizeUnit, parsePastedList, searchLibrary, type LibraryItem } from "@/lib/materials";
import { createMaterialRequestAction } from "@/app/(dashboard)/materials/actions";

type Line = { key: string; materialId: string | null; description: string; quantity: number; unit: string; category: string | null; notes: string; allowSubstitution: boolean; saveToLibrary: boolean };
type SavedList = { id: string; name: string; items: { materialId: string; quantity: number }[] };

let counter = 0;
const nextKey = () => `l${++counter}`;

export default function RequestBuilder({ projectId, projectName, items, lists }: { projectId: string; projectName: string; items: LibraryItem[]; lists: SavedList[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { permissions } = usePermissions();
  const canLibrary = permissions.can_manage_library;
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [listName, setListName] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => searchLibrary(items, query, query ? 8 : 6), [items, query]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function addLine(line: Omit<Line, "key">) {
    setLines((prev) => {
      const same = prev.find((l) => l.unit === line.unit && (line.materialId ? l.materialId === line.materialId : !l.materialId && l.description.toLowerCase() === line.description.toLowerCase()));
      if (same) return prev.map((l) => (l === same ? { ...l, quantity: Math.round((l.quantity + line.quantity) * 100) / 100 } : l));
      return [...prev, { ...line, key: nextKey() }];
    });
  }

  function addLibrary(item: LibraryItem, quantity = 1) {
    addLine({ materialId: item.id, description: item.description, quantity, unit: item.unit, category: item.category, notes: "", allowSubstitution: false, saveToLibrary: false });
    setQuery("");
  }

  function addFreeText() {
    const text = query.trim();
    if (!text) return;
    addLine({ materialId: null, description: text, quantity: 1, unit: "EA", category: null, notes: "", allowSubstitution: false, saveToLibrary: false });
    setQuery("");
  }

  const parsed = useMemo(() => (pasteOpen ? parsePastedList(pasteText) : []), [pasteOpen, pasteText]);

  function addPasted() {
    for (const p of parsed) {
      const match = findExact(items, p.description);
      if (match) addLine({ materialId: match.id, description: match.description, quantity: p.quantity, unit: p.unit ?? match.unit, category: match.category, notes: "", allowSubstitution: false, saveToLibrary: false });
      else addLine({ materialId: null, description: p.description, quantity: p.quantity, unit: p.unit ?? "EA", category: null, notes: "", allowSubstitution: false, saveToLibrary: false });
    }
    setPasteText("");
    setPasteOpen(false);
  }

  function useList(list: SavedList) {
    for (const entry of list.items) {
      const item = byId.get(entry.materialId);
      if (item) addLibrary(item, entry.quantity);
    }
  }

  const patch = (key: string, p: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const remove = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  async function submit() {
    setError(null);
    if (lines.length === 0) { setError(t("errRequestEmpty")); return; }
    setBusy(true);
    const result = await createMaterialRequestAction({
      projectId, neededBy: neededBy || null, notes: notes || null, saveListName: listName || null,
      lines: lines.map((l) => ({ materialId: l.materialId, description: l.description, quantity: l.quantity, unit: l.unit, category: l.category, notes: l.notes, allowSubstitution: l.allowSubstitution, saveToLibrary: l.saveToLibrary })),
    }).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; id?: string }));
    if (result.errorCode) { setError(t(result.errorCode as keyof Dictionary)); setBusy(false); return; }
    router.push(`/projects/${projectId}/materials/${result.id}`);
    router.refresh();
  }

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500";

  return <div className="mx-auto max-w-3xl p-4 pb-32 md:p-8">
    <h1 className="text-xl font-bold">{t("newMaterialRequest")}</h1>
    <p className="mb-4 text-sm text-slate-500">{projectName}</p>

    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (results[0] && query.trim()) addLibrary(results[0]); else addFreeText(); } }} placeholder={t("searchOrTypeItem")} aria-label={t("searchOrTypeItem")} className={`${input} pl-9`} />
    </div>

    <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {!query && results.length > 0 && <p className="px-4 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("favorites")} · {t("recentItems")}</p>}
      {results.map((item) => <button key={item.id} type="button" onClick={() => addLibrary(item)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50">
        {item.is_favorite ? <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /> : <Plus className="h-4 w-4 shrink-0 text-slate-400" />}
        <span className="min-w-0 flex-1 truncate">{item.description}</span><span className="text-xs text-slate-400">{item.unit}</span>
      </button>)}
      {query.trim() && <button type="button" onClick={addFreeText} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"><Plus className="h-4 w-4" />{t("addAsFreeText", { text: query.trim() })}</button>}
      {!query && results.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">{t("noItemsYet")}</p>}
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => setPasteOpen((v) => !v)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"><ClipboardPaste className="h-4 w-4" />{t("pasteList")}</button>
      {lists.length > 0 && <div className="flex items-center gap-2 text-sm"><ListChecks className="h-4 w-4 text-slate-400" /><span className="text-slate-500">{t("savedLists")}:</span>{lists.map((l) => <button key={l.id} type="button" onClick={() => useList(l)} className="min-h-10 rounded-lg border border-brand-500 bg-brand-50 px-3 text-xs font-semibold text-brand-700">{l.name}</button>)}</div>}
    </div>

    {pasteOpen && <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs text-slate-500">{t("pasteListHint")}</p>
      <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} aria-label={t("pasteList")} className={input} />
      <button type="button" disabled={parsed.length === 0} onClick={addPasted} className="mt-2 min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("addPastedLines", { count: String(parsed.length) })}</button>
    </div>}

    <h2 className="mb-2 mt-6 font-semibold">{t("requestLines")} ({lines.length})</h2>
    {lines.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">{t("noLinesYet")}</p> :
      <ul className="space-y-2">{lines.map((l) => <li key={l.key} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 break-words text-sm font-medium">{l.description}</p>
          <button type="button" onClick={() => remove(l.key)} aria-label={t("removeLine")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200">
            <button type="button" aria-label="-" onClick={() => patch(l.key, { quantity: Math.max(1, l.quantity - 1) })} className="flex h-10 w-10 items-center justify-center"><Minus className="h-4 w-4" /></button>
            <input type="number" inputMode="decimal" min={0.01} step="any" value={l.quantity} aria-label={t("quantity")} onChange={(e) => patch(l.key, { quantity: Number(e.target.value) > 0 ? Number(e.target.value) : 1 })} className="h-10 w-16 border-x border-slate-200 text-center text-base outline-none" />
            <button type="button" aria-label="+" onClick={() => patch(l.key, { quantity: l.quantity + 1 })} className="flex h-10 w-10 items-center justify-center"><Plus className="h-4 w-4" /></button>
          </div>
          <select value={l.unit} aria-label={t("itemUnit")} onChange={(e) => patch(l.key, { unit: normalizeUnit(e.target.value) })} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm">{MATERIAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          <label className="flex min-h-10 items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={l.allowSubstitution} onChange={(e) => patch(l.key, { allowSubstitution: e.target.checked })} />{t("allowSubstitution")}</label>
          {canLibrary && !l.materialId && <label className="flex min-h-10 items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={l.saveToLibrary} onChange={(e) => patch(l.key, { saveToLibrary: e.target.checked })} />{t("saveNewToLibrary")}</label>}
        </div>
      </li>)}</ul>}

    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-medium">{t("neededBy")}<input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={`${input} mt-1`} /></label>
      {canLibrary && <label className="block text-sm font-medium">{t("saveAsList")}<input value={listName} maxLength={120} onChange={(e) => setListName(e.target.value)} className={`${input} mt-1`} /></label>}
    </div>
    <label className="mt-3 block text-sm font-medium">{t("requestNotes")}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} className={`${input} mt-1`} /></label>

    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:left-64" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto max-w-3xl"><button type="button" disabled={busy || lines.length === 0} onClick={submit} className="min-h-12 w-full rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-40">{t("sendRequest")}</button></div>
    </div>
  </div>;
}
