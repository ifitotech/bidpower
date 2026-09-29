"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { TAKEOFF_CATEGORIES, deriveMaterials, takeoffTotals } from "@/lib/takeoff";
import type { TakeoffFull } from "@/lib/services/takeoffs";
import { addPlanAction, getPlanUrlAction, takeoffRowAction, takeoffToRequestAction, updateTakeoffAction, verifyTakeoffAction } from "../actions";

const field = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-base outline-none focus:border-brand-500";
const btn = "min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-40";
const NOTE_KEYS = { feederIncomplete: "tkNoteFeederIncomplete", noBranchWire: "tkNoteNoBranchWire", noFittings: "tkNoteNoFittings" } as const;

export default function TakeoffDetail({ takeoff: tk, isReviewer, canRequest, canUpload }: { takeoff: TakeoffFull; isReviewer: boolean; canRequest: boolean; canUpload: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [waste, setWaste] = useState(String(tk.waste_pct));
  const fileRef = useRef<HTMLInputElement>(null);

  const derived = useMemo(() => deriveMaterials({ counts: tk.counts, panels: tk.panels, feeders: tk.feeders, wastePct: tk.waste_pct }), [tk]);
  const totals = takeoffTotals(tk.counts, tk.panels, tk.feeders);
  const verified = tk.status === "verified";

  async function run<T extends { errorCode?: string }>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true); setError(null); setInfo(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }) as T);
    setBusy(false);
    if (res.errorCode) { setError(t(res.errorCode as keyof Dictionary)); return null; }
    router.refresh();
    return res;
  }
  const row = (op: Parameters<typeof takeoffRowAction>[1]) => run(() => takeoffRowAction(tk.id, op));

  async function openPlan(id: string) {
    const res = await getPlanUrlAction(id).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; url?: string }));
    if (res.errorCode || !res.url) { setError(t((res.errorCode ?? "errGeneric") as keyof Dictionary)); return; }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  const del = (kind: "count" | "panel" | "circuit" | "feeder", id: string) => <button type="button" disabled={busy} aria-label={t("tkDelete")} onClick={() => row({ kind, id, remove: true })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>;

  return <div className="mx-auto max-w-3xl p-4 pb-16 md:p-8">
    <div className="mb-3 flex items-start gap-3">
      <Link href={`/projects/${tk.project_id}/takeoff`} aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1"><p className="text-xs text-slate-400">{tk.number} · {tk.project?.name}</p><h1 className="truncate text-lg font-bold">{tk.title}</h1></div>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{verified ? t("tkVerified") : t("tkPrelim")}</span>
    </div>
    <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("tkPrelimBanner")}</p>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    {info && <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{info}</div>}
    <p className="mb-4 text-xs text-slate-500">{t("tkTotals", { fixtures: String(totals.fixtures), devices: String(totals.devices), panels: String(totals.panels), circuits: String(totals.circuits), feet: String(totals.feederFeet) })}</p>

    {isReviewer && <div className="mb-6 flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => run(() => verifyTakeoffAction(tk.id, !verified))} className={`${btn} ${verified ? "border border-slate-200" : "bg-brand-600 text-white"}`}>{verified ? t("tkUnverify") : t("tkVerify")}</button>
      <span className="text-xs text-slate-400">{verified && tk.verifier?.full_name ? t("tkVerifiedBy", { name: tk.verifier.full_name, date: tk.verified_at ? formatDate(tk.verified_at) : "" }) : t("tkVerifyHint")}</span>
    </div>}

    <Section title={t("tkPlans")} hint={t("tkPlansHint")}>
      <ul className="space-y-1.5">{tk.documents.map((d) => <li key={d.id}><button type="button" onClick={() => openPlan(d.id)} className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm"><FileText className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1 truncate">{d.name}</span></button></li>)}</ul>
      {canUpload && <><input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const form = new FormData(); form.set("takeoffId", tk.id); form.set("file", f); run(() => addPlanAction(form)); if (fileRef.current) fileRef.current.value = ""; }} />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="mt-2 flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-medium"><Upload className="h-4 w-4" />{t("uploadDocument")}</button></>}
    </Section>

    <Section title={t("tkCounts")}>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{tk.counts.map((c) => <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm"><div className="min-w-0 flex-1"><p className="truncate font-medium">{c.label}</p><p className="text-xs text-slate-400">{t(TAKEOFF_CATEGORIES.find((x) => x.code === c.category)?.key ?? "tkCatOther")}{c.plan_ref ? ` · ${c.plan_ref}` : ""}</p></div><span className="font-semibold">{c.quantity}</span>{del("count", c.id)}</li>)}</ul>
      <CountForm busy={busy} onAdd={(data) => row({ kind: "count", takeoffId: tk.id, data })} />
    </Section>

    <Section title={t("tkPanels")}>
      <div className="space-y-3">{tk.panels.map((p) => <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-slate-400">{[p.voltage, p.phases === 3 ? t("tkPhase3") : t("tkPhase1"), p.bus_amps ? `${p.bus_amps}A bus` : null, p.main_breaker_amps ? `${p.main_breaker_amps}A main` : null].filter(Boolean).join(" · ")}</p></div>{del("panel", p.id)}</div>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">{p.circuits.map((c) => <li key={c.id} className="flex items-center gap-2 py-1.5"><span className="w-10 shrink-0 text-slate-400">{c.circuit_no}</span><span className="min-w-0 flex-1 truncate">{c.description || "—"}</span><span className="shrink-0 font-medium">{c.breaker_amps}A / {c.poles}P</span>{del("circuit", c.id)}</li>)}</ul>
        <CircuitForm busy={busy} nextNo={String(p.circuits.length + 1)} onAdd={(data) => row({ kind: "circuit", panelId: p.id, data })} />
      </div>)}</div>
      <PanelForm busy={busy} onAdd={(data) => row({ kind: "panel", takeoffId: tk.id, data })} />
    </Section>

    <Section title={t("tkFeeders")}>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{tk.feeders.map((f) => <li key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm"><div className="min-w-0 flex-1"><p className="truncate font-medium">{f.name}{f.from_label || f.to_label ? ` · ${f.from_label ?? "?"} → ${f.to_label ?? "?"}` : ""}</p><p className="truncate text-xs text-slate-400">{[f.conductors && f.conductor_size ? `${f.conductors}× ${f.conductor_size}` : null, f.ground_size ? `${f.ground_size} gnd` : null, f.conduit_size ? `${f.conduit_size} ${f.conduit_type ?? ""}` : null].filter(Boolean).join(" · ")}</p></div><span className="font-semibold">{f.length_ft} ft</span>{del("feeder", f.id)}</li>)}</ul>
      <FeederForm busy={busy} onAdd={(data) => row({ kind: "feeder", takeoffId: tk.id, data })} />
    </Section>

    <Section title={t("tkMaterials")}>
      <div className="mb-3 flex items-end gap-2"><label className="block text-sm font-medium">{t("tkWaste")}<input inputMode="decimal" value={waste} onChange={(e) => setWaste(e.target.value)} className={`${field} mt-1 w-28`} /></label>
        <button type="button" disabled={busy || Number(waste.replace(",", ".")) === tk.waste_pct} onClick={() => run(() => updateTakeoffAction(tk.id, { waste_pct: Number(waste.replace(",", ".")) }))} className={`${btn} border border-slate-200`}>{t("save")}</button></div>
      {derived.lines.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">{t("tkMaterialsEmpty")}</p> :
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{derived.lines.map((l) => <li key={l.key} className="flex items-start gap-3 px-3 py-2 text-sm"><div className="min-w-0 flex-1"><p className="break-words font-medium">{l.description}</p><p className="text-xs text-slate-400">{t("tkBasis", { basis: l.basis })}</p></div><span className="shrink-0 font-semibold">{l.quantity} {l.unit}</span></li>)}</ul>}
      {derived.notes.length > 0 && <ul className="mt-3 space-y-1 text-xs text-slate-500">{derived.notes.map((n, i) => <li key={i}>• {t(NOTE_KEYS[n.code], n.params)}</li>)}</ul>}
      <p className="mt-3 text-xs font-semibold text-amber-800">{t("tkPrelim")}</p>
      {canRequest && derived.lines.length > 0 && <div className="mt-2"><button type="button" disabled={busy} onClick={async () => { const res = await run(() => takeoffToRequestAction(tk.id)); if (res) setInfo(t("tkRequestCreated")); }} className={`${btn} w-full bg-brand-600 text-white`}>{t("tkToRequest")}</button><p className="mt-1 text-xs text-slate-400">{t("tkToRequestHint")}</p></div>}
    </Section>
  </div>;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="mb-7"><h2 className="font-semibold">{title}</h2>{hint && <p className="mb-2 text-xs text-slate-400">{hint}</p>}<div className={hint ? "" : "mt-2"}>{children}</div></section>;
}

function CountForm({ busy, onAdd }: { busy: boolean; onAdd: (d: Record<string, unknown>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [category, setCategory] = useState("lighting");
  const [label, setLabel] = useState(""); const [quantity, setQuantity] = useState(""); const [planRef, setPlanRef] = useState("");
  return <div className="mt-2 grid grid-cols-[1fr_5rem] gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[9rem_1fr_5rem_8rem_auto]">
    <select aria-label={t("category")} value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} col-span-2 sm:col-span-1`}>{TAKEOFF_CATEGORIES.map((c) => <option key={c.code} value={c.code}>{t(c.key)}</option>)}</select>
    <input aria-label={t("tkLabel")} placeholder={t("tkLabel")} value={label} maxLength={200} onChange={(e) => setLabel(e.target.value)} className={field} />
    <input aria-label={t("quantity")} placeholder={t("quantity")} inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={field} />
    <input aria-label={t("tkPlanRef")} placeholder={t("tkPlanRef")} value={planRef} maxLength={120} onChange={(e) => setPlanRef(e.target.value)} className={`${field} col-span-2 sm:col-span-1`} />
    <button type="button" disabled={busy || !label.trim() || !quantity.trim()} onClick={async () => { await onAdd({ category, label, quantity, plan_ref: planRef }); setLabel(""); setQuantity(""); }} className={`${btn} col-span-2 bg-brand-600 text-white sm:col-span-1`}>{t("tkAdd")}</button>
  </div>;
}

function PanelForm({ busy, onAdd }: { busy: boolean; onAdd: (d: Record<string, unknown>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [name, setName] = useState(""); const [voltage, setVoltage] = useState(""); const [phases, setPhases] = useState("1"); const [bus, setBus] = useState(""); const [main, setMain] = useState("");
  return <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
    <input aria-label={t("tkPanelName")} placeholder={t("tkPanelName")} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={field} />
    <input aria-label={t("tkVoltage")} placeholder={t("tkVoltage")} value={voltage} maxLength={40} onChange={(e) => setVoltage(e.target.value)} className={field} />
    <select aria-label={t("tkPhases")} value={phases} onChange={(e) => setPhases(e.target.value)} className={field}><option value="1">{t("tkPhase1")}</option><option value="3">{t("tkPhase3")}</option></select>
    <input aria-label={t("tkBusAmps")} placeholder={t("tkBusAmps")} inputMode="numeric" value={bus} onChange={(e) => setBus(e.target.value)} className={field} />
    <input aria-label={t("tkMainAmps")} placeholder={t("tkMainAmps")} inputMode="numeric" value={main} onChange={(e) => setMain(e.target.value)} className={field} />
    <button type="button" disabled={busy || !name.trim()} onClick={async () => { await onAdd({ name, voltage, phases, bus_amps: bus, main_breaker_amps: main }); setName(""); setVoltage(""); setBus(""); setMain(""); }} className={`${btn} bg-brand-600 text-white`}>{t("tkAddPanel")}</button>
  </div>;
}

function CircuitForm({ busy, nextNo, onAdd }: { busy: boolean; nextNo: string; onAdd: (d: Record<string, unknown>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [no, setNo] = useState(nextNo); const [desc, setDesc] = useState(""); const [amps, setAmps] = useState("20"); const [poles, setPoles] = useState("1");
  return <div className="mt-2 grid grid-cols-[4rem_1fr_4.5rem_4rem_auto] gap-2">
    <input aria-label={t("tkCircuit")} value={no} maxLength={20} onChange={(e) => setNo(e.target.value)} className={field} />
    <input aria-label={t("description")} placeholder={t("description")} value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} className={field} />
    <input aria-label={t("tkBreakerAmps")} inputMode="numeric" value={amps} onChange={(e) => setAmps(e.target.value)} className={field} />
    <select aria-label={t("tkPoles")} value={poles} onChange={(e) => setPoles(e.target.value)} className={field}><option>1</option><option>2</option><option>3</option></select>
    <button type="button" disabled={busy || !no.trim() || !amps.trim()} onClick={async () => { await onAdd({ circuit_no: no, description: desc, breaker_amps: amps, poles }); setNo(String(Number(no) + 1 || "")); setDesc(""); }} className="min-h-10 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-40">{t("tkAddCircuit")}</button>
  </div>;
}

function FeederForm({ busy, onAdd }: { busy: boolean; onAdd: (d: Record<string, unknown>) => Promise<unknown> }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: "", from_label: "", to_label: "", length_ft: "", conductor_size: "", conductors: "", ground_size: "", conduit_size: "", conduit_type: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const ph: Record<keyof typeof f, string> = { name: t("tkFeederName"), from_label: t("tkFrom"), to_label: t("tkTo"), length_ft: t("tkLengthFt"), conductor_size: t("tkConductorSize"), conductors: t("tkConductors"), ground_size: t("tkGroundSize"), conduit_size: t("tkConduitSize"), conduit_type: t("tkConduitType") };
  return <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
    {(Object.keys(f) as (keyof typeof f)[]).map((k) => <input key={k} aria-label={ph[k]} placeholder={ph[k]} inputMode={k === "length_ft" || k === "conductors" ? "decimal" : undefined} value={f[k]} onChange={(e) => set(k, e.target.value)} className={field} />)}
    <button type="button" disabled={busy || !f.name.trim() || !f.length_ft.trim()} onClick={async () => { await onAdd(f); setF({ name: "", from_label: "", to_label: "", length_ft: "", conductor_size: "", conductors: "", ground_size: "", conduit_size: "", conduit_type: "" }); }} className={`${btn} bg-brand-600 text-white`}>{t("tkAddFeeder")}</button>
  </div>;
}
