"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardPaste, FileSpreadsheet, History, ListChecks, Minus, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { parseMaterialImport } from "@/lib/material-import";
import { readSheetText } from "@/lib/read-sheet";
import { MATERIAL_UNITS, findExact, normalizeUnit, parsePastedList, searchLibrary, splitQuantity, type LibraryItem } from "@/lib/materials";
import { createMaterialRequestAction, saveListAction } from "@/app/(dashboard)/materials/actions";
import { confirmAsk } from "@/lib/confirm";
import { CATALOG_PREFIX, catalogToLibrary } from "@/lib/catalog/types";
import { useCatalogSearch } from "@/lib/catalog/use-catalog-search";
import type { RepeatableRequest } from "@/lib/services/material-requests";

type Line = { key: string; catalogId?: string | null; materialId: string | null; description: string; quantity: number; unit: string; category: string | null; notes: string; allowSubstitution: boolean; saveToLibrary: boolean };
type LibItem = LibraryItem & { allow_substitution?: boolean };
type SavedList = { id: string; name: string; items: { materialId: string; quantity: number }[] };

let counter = 0;
const nextKey = () => `l${++counter}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
/** What a line points at: the company library item, or a standard-catalog item not yet in the library. */
const refOf = (l: { materialId: string | null; catalogId?: string | null }) => l.materialId ?? (l.catalogId ? CATALOG_PREFIX + l.catalogId : null);

/**
 * Building a material list should feel like filling a cart: tap + to add, tap again for one more, type a number for many.
 * Lists you saved and orders you made before add many lines in one tap.
 */
export default function RequestBuilder({ projectId, projectName, items, lists, repeatable = [] }: { projectId: string; projectName: string; items: LibItem[]; lists: SavedList[]; repeatable?: RepeatableRequest[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const { permissions } = usePermissions();
  const canLibrary = permissions.can_manage_library;
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState<string | null>(null); // list name being typed; null = closed
  const [flash, setFlash] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typed = useMemo(() => splitQuantity(query), [query]);
  // The shared catalog is searched on the server while typing (nothing is listed until then); the company's own items always rank first.
  const { items: catalog, loading: catalogLoading } = useCatalogSearch(typed.text);
  const catalogItems = useMemo(() => {
    const own = new Set(items.map((i) => i.description.toLowerCase()));
    return catalog.filter((c) => !own.has(c.n.toLowerCase())).map(catalogToLibrary);
  }, [catalog, items]);
  const everything = useMemo(() => [...items, ...catalogItems], [items, catalogItems]);
  const results = useMemo(() => searchLibrary(typed.text ? everything : items, typed.text, typed.text ? 8 : 5), [everything, items, typed.text]);
  const byId = useMemo(() => new Map(everything.map((i) => [i.id, i])), [everything]);
  const frequent = useMemo(() => (typed.text ? [] : [...items].filter((i) => i.use_count > 1 && !i.is_favorite).sort((a, b) => b.use_count - a.use_count).slice(0, 5)), [items, typed.text]);
  const favorites = useMemo(() => (typed.text ? [] : items.filter((i) => i.is_favorite).slice(0, 8)), [items, typed.text]);
  const qtyIn = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of lines) { const r = refOf(l); if (r) m.set(r, round2((m.get(r) ?? 0) + l.quantity)); }
    return m;
  }, [lines]);

  const say = (message: string) => setFlash(message);

  function addLine(line: Omit<Line, "key">) {
    setLines((prev) => {
      const ref = refOf(line);
      const same = prev.find((l) => l.unit === line.unit && (ref ? refOf(l) === ref : !refOf(l) && l.description.toLowerCase() === line.description.toLowerCase()));
      if (same) return prev.map((l) => (l === same ? { ...l, quantity: round2(l.quantity + line.quantity) } : l));
      return [...prev, { ...line, key: nextKey() }];
    });
  }

  function addLibrary(item: LibItem, quantity = 1) {
    if (item.id.startsWith(CATALOG_PREFIX)) {
      addLine({ materialId: null, catalogId: item.id.slice(CATALOG_PREFIX.length), description: item.description, quantity, unit: item.unit, category: item.category, notes: "", allowSubstitution: false, saveToLibrary: false });
      return;
    }
    addLine({ materialId: item.id, description: item.description, quantity, unit: item.unit, category: item.category, notes: "", allowSubstitution: Boolean(item.allow_substitution), saveToLibrary: false });
  }
  function addFree(text: string, quantity = 1) {
    addLine({ materialId: null, description: text, quantity, unit: "EA", category: null, notes: "", allowSubstitution: false, saveToLibrary: false });
  }

  // + on a library row: one more of that item (or the typed quantity, "thhn 8 red x 500").
  function tapAdd(item: LibItem) {
    const n = typed.quantity ?? 1;
    addLibrary(item, n);
    say(t("mbAdded", { name: item.description }));
    if (typed.quantity) { setQuery(""); searchRef.current?.focus(); }
  }
  function tapRemoveOne(item: LibItem) {
    setLines((prev) => {
      const line = prev.find((l) => refOf(l) === item.id);
      if (!line) return prev;
      return line.quantity > 1 ? prev.map((l) => (l === line ? { ...l, quantity: round2(l.quantity - 1) } : l)) : prev.filter((l) => l !== line);
    });
  }
  function setLibraryQty(item: LibItem, value: number) {
    setLines((prev) => {
      const mine = prev.filter((l) => refOf(l) === item.id);
      if (mine.length === 0) return prev;
      if (!(value > 0)) return prev.filter((l) => refOf(l) !== item.id);
      return prev.map((l) => (l === mine[0] ? { ...l, quantity: value } : l)).filter((l) => l === mine[0] || refOf(l) !== item.id);
    });
  }

  // Enter adds the first match (with the typed quantity, or 1) and keeps the cursor in the search box for the next one.
  function onSearchEnter() {
    if (!typed.text) return;
    const first = results[0];
    const n = typed.quantity ?? 1;
    if (first) { addLibrary(first, n); say(t("mbAdded", { name: first.description })); } else { addFree(typed.text, n); say(t("mbAdded", { name: typed.text })); }
    setQuery("");
  }

  const parsed = useMemo(() => (pasteOpen ? parsePastedList(pasteText) : []), [pasteOpen, pasteText]);

  function addPasted() {
    for (const p of parsed) {
      const match = findExact(items, p.description);
      if (match) addLine({ materialId: match.id, description: match.description, quantity: p.quantity, unit: p.unit ?? match.unit, category: match.category, notes: "", allowSubstitution: Boolean((match as LibItem).allow_substitution), saveToLibrary: false });
      else addLine({ materialId: null, description: p.description, quantity: p.quantity, unit: p.unit ?? "EA", category: null, notes: "", allowSubstitution: false, saveToLibrary: false });
    }
    setPasteText("");
    setPasteOpen(false);
  }

  function useList(list: SavedList) {
    let n = 0;
    for (const entry of list.items) {
      const item = byId.get(entry.materialId);
      if (item) { addLibrary(item, entry.quantity); n++; }
    }
    say(t("mbListAdded", { count: String(n), name: list.name }));
  }

  function repeatRequest(r: RepeatableRequest) {
    for (const l of r.lines) {
      const item = l.materialId ? byId.get(l.materialId) : undefined;
      if (item) addLine({ materialId: item.id, description: item.description, quantity: l.quantity, unit: l.unit, category: item.category, notes: "", allowSubstitution: l.allowSubstitution, saveToLibrary: false });
      else addLine({ materialId: null, description: l.description, quantity: l.quantity, unit: l.unit, category: l.category, notes: "", allowSubstitution: l.allowSubstitution, saveToLibrary: false });
    }
    say(t("mbListAdded", { count: String(r.lines.length), name: r.number }));
  }

  async function saveList() {
    const name = (saving ?? "").trim();
    if (!name || lines.length === 0) return;
    if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase()) && !(await confirmAsk(t("mbListReplaceConfirm", { name })))) return;
    setBusy(true);
    const res = await saveListAction({ name, lines: lines.map((l) => ({ materialId: l.materialId, catalogId: l.catalogId ?? null, description: l.description, quantity: l.quantity, unit: l.unit, category: l.category })) }).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string }));
    setBusy(false);
    if (res.errorCode) { setError(t(res.errorCode as keyof Dictionary)); return; }
    setError(null);
    setSaving(null);
    say(t("mbListSaved", { name }));
    router.refresh();
  }

  // A spreadsheet that already exists (description, part number, unit, quantity) goes straight into this list; library items are recognized.
  async function importFile(file: File) {
    setError(null);
    try {
      const parsedFile = parseMaterialImport(await readSheetText(file));
      if (parsedFile.missingDescription || parsedFile.rows.length === 0) { setError(t("importNoDescription")); return; }
      let known = 0;
      for (const row of parsedFile.rows) {
        const pn = row.catalog_number ? row.catalog_number.toLowerCase() : null;
        const match = (pn && items.find((i) => (i.catalog_number ?? "").toLowerCase() === pn)) || findExact(items, row.description);
        const quantity = row.quantity ?? 1;
        if (match) { known++; addLine({ materialId: match.id, description: match.description, quantity, unit: row.unit || match.unit, category: match.category, notes: "", allowSubstitution: Boolean((match as LibItem).allow_substitution), saveToLibrary: false }); }
        else addLine({ materialId: null, description: row.description, quantity, unit: row.unit || "EA", category: row.category, notes: "", allowSubstitution: false, saveToLibrary: canLibrary });
      }
      say(t("mbImported", { count: String(parsedFile.rows.length), known: String(known) }));
    } catch (e) { setError(t(e instanceof Error && e.message === "xls" ? "importXlsOld" : "importXlsError")); }
  }

  const patch = (key: string, p: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const remove = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  async function submit() {
    setError(null);
    if (lines.length === 0) { setError(t("errRequestEmpty")); return; }
    setBusy(true);
    const result = await createMaterialRequestAction({
      projectId, neededBy: neededBy || null, notes: notes || null,
      lines: lines.map((l) => ({ materialId: l.materialId, catalogId: l.catalogId ?? null, description: l.description, quantity: l.quantity, unit: l.unit, category: l.category, notes: l.notes, allowSubstitution: l.allowSubstitution, saveToLibrary: l.saveToLibrary })),
    }).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; id?: string }));
    if (result.errorCode) { setError(t(result.errorCode as keyof Dictionary)); setBusy(false); return; }
    router.push(`/projects/${projectId}/materials/${result.id}`);
    router.refresh();
  }

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500";
  const totalQty = lines.length;

  // One result row: tap the name for +1; the right side becomes a stepper once the item is in the list.
  const row = (item: LibItem, hint?: string) => {
    const q = qtyIn.get(item.id) ?? 0;
    return <div key={item.id} className="flex min-h-14 items-center gap-1 px-2">
      <button type="button" onClick={() => tapAdd(item)} aria-label={`${t("mbAddOne")}: ${item.description}`} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left text-sm">
        {item.is_favorite ? <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /> : <span className="w-4 shrink-0" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{item.description}{item.id.startsWith(CATALOG_PREFIX) && <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase text-slate-500">{t("catalogBadge")}</span>}</span>
          <span className="block truncate text-xs text-slate-400">{[item.manufacturer, item.catalog_number, item.unit, hint ?? (item.use_count > 1 ? t("mbUsedTimes", { count: String(item.use_count) }) : "")].filter(Boolean).join(" · ")}</span>
        </span>
      </button>
      {q > 0 ? <div className="flex shrink-0 items-center rounded-full border border-brand-500 bg-brand-50">
        <button type="button" aria-label={`${t("mbRemoveOne")}: ${item.description}`} onClick={() => tapRemoveOne(item)} className="flex h-11 w-11 items-center justify-center text-brand-700">{q <= 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</button>
        <input type="number" inputMode="decimal" min={0} step="any" value={q} aria-label={`${t("quantity")}: ${item.description}`} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setLibraryQty(item, Number(e.target.value))} className="h-11 w-14 bg-transparent text-center text-base font-semibold outline-none" />
        <button type="button" aria-label={`${t("mbAddOne")}: ${item.description}`} onClick={() => tapAdd(item)} className="flex h-11 w-11 items-center justify-center text-brand-700"><Plus className="h-4 w-4" /></button>
      </div> : <button type="button" aria-label={`${t("addToList")}: ${item.description}`} onClick={() => tapAdd(item)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"><Plus className="h-5 w-5" /></button>}
    </div>;
  };
  const group = (title: string, list: LibItem[]) => list.length > 0 && <div key={title}><p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p><div className="divide-y divide-slate-50">{list.map((i) => row(i))}</div></div>;

  return <div className="mx-auto max-w-3xl p-4 pb-32 md:p-8">
    <h1 className="text-xl font-bold">{t("newMaterialRequest")}</h1>
    <p className="mb-4 text-sm text-slate-500">{projectName}</p>

    <div className="sticky top-0 z-20 -mx-4 bg-slate-50/95 px-4 pb-2 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSearchEnter(); } }} autoComplete="off" enterKeyHint="done" placeholder={t("searchOrTypeItem")} aria-label={t("searchOrTypeItem")} className={`${input} pl-9`} />
      </div>
      <p role="status" className="mt-1 h-4 truncate text-xs text-brand-700">{flash || <span className="text-slate-400">{t("mbAddedHint")}</span>}</p>
    </div>

    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white pb-1">
      {typed.text ? <>
        {results.map((i) => row(i))}
        {catalogLoading && results.length === 0 && <p className="px-4 py-3 text-sm text-slate-400" role="status">{t("catalogSearching")}</p>}
        <button type="button" onClick={() => { addFree(typed.text, typed.quantity ?? 1); say(t("mbAdded", { name: typed.text })); setQuery(""); searchRef.current?.focus(); }} className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"><Plus className="h-4 w-4" />{t("addAsFreeText", { text: typed.text })}</button>
      </> : <>
        {group(t("favorites"), favorites)}
        {group(t("mbFrequent"), frequent)}
        {group(t("recentItems"), results.filter((i) => !favorites.includes(i) && !frequent.includes(i)))}
        {items.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">{t("noItemsYet")}</p>}
      </>}
    </div>

    {lists.length > 0 && <section className="mt-4" aria-label={t("savedLists")}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><ListChecks className="h-3.5 w-3.5" />{t("savedLists")}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">{lists.map((l) => <button key={l.id} type="button" onClick={() => useList(l)} className="min-h-12 shrink-0 rounded-xl border border-brand-500 bg-brand-50 px-3 text-left"><span className="block text-sm font-semibold text-brand-800">{l.name}</span><span className="block text-xs text-brand-700">{t("itemsCount", { count: String(l.items.length) })}</span></button>)}</div>
      <p className="text-xs text-slate-400">{t("mbListsHint")}</p>
    </section>}

    {repeatable.length > 0 && <section className="mt-4" aria-label={t("mbRepeat")}>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><History className="h-3.5 w-3.5" />{t("mbRepeat")}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">{repeatable.map((r) => <button key={r.id} type="button" onClick={() => repeatRequest(r)} className="min-h-12 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-left"><span className="block text-sm font-semibold">{t("mbRepeatLine", { number: r.number, count: String(r.lines.length) })}</span><span className="block max-w-[11rem] truncate text-xs text-slate-500">{r.projectName ?? ""}</span></button>)}</div>
    </section>}

    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPasteOpen((v) => !v)} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"><ClipboardPaste className="h-4 w-4" />{t("pasteList")}</button>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"><FileSpreadsheet className="h-4 w-4" />{t("mbImportFile")}<input type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await importFile(file); }} /></label>
      </div>
      <p className="mt-1 text-xs text-slate-400">{t("mbImportHint")}</p>
    </div>
    {pasteOpen && <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs text-slate-500">{t("pasteListHint")}</p>
      <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={6} aria-label={t("pasteList")} className={input} />
      <button type="button" disabled={parsed.length === 0} onClick={addPasted} className="mt-2 min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("addPastedLines", { count: String(parsed.length) })}</button>
    </div>}

    <div className="mb-2 mt-6 flex items-center gap-2">
      <h2 className="flex-1 font-semibold">{t("requestLines")} ({totalQty})</h2>
      {lines.length > 0 && <button type="button" onClick={() => setLines([])} className="min-h-9 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100">{t("mbClearLines")}</button>}
      {canLibrary && lines.length > 0 && saving === null && <button type="button" onClick={() => setSaving("")} className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold"><Save className="h-3.5 w-3.5" />{t("mbSaveAsList")}</button>}
    </div>
    {saving !== null && <div className="mb-3 flex gap-2 rounded-xl border border-brand-500 bg-brand-50 p-2">
      <input autoFocus value={saving} maxLength={120} onChange={(e) => setSaving(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveList(); } if (e.key === "Escape") setSaving(null); }} placeholder={t("mbListNamePh")} aria-label={t("mbSaveAsList")} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-base outline-none" />
      <button type="button" disabled={busy || !saving.trim()} onClick={() => void saveList()} className="flex min-h-11 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-40"><Check className="h-4 w-4" />{t("mbSaveList")}</button>
      <button type="button" onClick={() => setSaving(null)} aria-label={t("cancel")} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500"><X className="h-4 w-4" /></button>
    </div>}
    {lines.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">{t("noLinesYet")}</p> :
      <ul className="space-y-2">{lines.map((l) => <li key={l.key} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 break-words text-sm font-medium">{l.description}</p>
          <button type="button" onClick={() => remove(l.key)} aria-label={t("removeLine")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200">
            <button type="button" aria-label="-" onClick={() => patch(l.key, { quantity: Math.max(1, round2(l.quantity - 1)) })} className="flex h-10 w-10 items-center justify-center"><Minus className="h-4 w-4" /></button>
            <input type="number" inputMode="decimal" min={0.01} step="any" value={l.quantity} aria-label={`${t("quantity")} (${l.description})`} onFocus={(e) => e.currentTarget.select()} onChange={(e) => patch(l.key, { quantity: Number(e.target.value) > 0 ? Number(e.target.value) : 1 })} className="h-10 w-16 border-x border-slate-200 text-center text-base outline-none" />
            <button type="button" aria-label="+" onClick={() => patch(l.key, { quantity: round2(l.quantity + 1) })} className="flex h-10 w-10 items-center justify-center"><Plus className="h-4 w-4" /></button>
          </div>
          {[10, 50, 100].map((n) => <button key={n} type="button" onClick={() => patch(l.key, { quantity: round2(l.quantity + n) })} className="min-h-10 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">+{n}</button>)}
          <select value={l.unit} aria-label={t("itemUnit")} onChange={(e) => patch(l.key, { unit: normalizeUnit(e.target.value) })} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm">{MATERIAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
          <label className="flex min-h-10 items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={l.allowSubstitution} onChange={(e) => patch(l.key, { allowSubstitution: e.target.checked })} />{t("allowSubstitution")}</label>
          {canLibrary && !l.materialId && <label className="flex min-h-10 items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={l.saveToLibrary} onChange={(e) => patch(l.key, { saveToLibrary: e.target.checked })} />{t("saveNewToLibrary")}</label>}
        </div>
      </li>)}</ul>}

    <div className="mt-6 grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-medium">{t("neededBy")}<input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className={`${input} mt-1`} /></label>
    </div>
    <label className="mt-3 block text-sm font-medium">{t("requestNotes")}<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} className={`${input} mt-1`} /></label>

    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    <div className="fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom,0px))] z-30 border-t md:bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:left-64">
      <div className="mx-auto max-w-3xl"><button type="button" disabled={busy || lines.length === 0} onClick={submit} className="min-h-12 w-full rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-40">{t("sendRequest")}{lines.length > 0 ? ` · ${t("itemsCount", { count: String(lines.length) })}` : ""}</button></div>
    </div>
  </div>;
}
