"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { createSupplierAction } from "@/app/(dashboard)/pricing/actions";
import { redeemSupplyCodeAction, revokeConnectionAction } from "@/app/supply/actions";

export type SupplierRow = { id: string; name: string; connected: boolean; connectionId: string | null };
const field = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-base outline-none focus:border-brand-500";

export default function SuppliersClient({ rows, error = false }: { rows: SupplierRow[]; error?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [linkTo, setLinkTo] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(fn: () => Promise<{ errorCode?: string }>, okText?: string) {
    setBusy(true); setMsg(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }));
    setBusy(false);
    setMsg(res.errorCode ? { ok: false, text: t(res.errorCode as keyof Dictionary) } : okText ? { ok: true, text: okText } : null);
    if (!res.errorCode) router.refresh();
    return !res.errorCode;
  }

  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <h1 className="text-xl font-bold">{t("navSuppliers")}</h1>
    <p className="mb-4 text-sm text-slate-500">{t("suppliersHint")}</p>
    {(error || msg) && <div role={msg?.ok ? "status" : "alert"} className={`mb-4 rounded-xl border p-3 text-sm ${msg?.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>{error ? t("errGeneric") : msg?.text}</div>}
    <section className="mb-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{t("connectWithCode")}</h2>
      <input value={code} maxLength={24} autoComplete="off" aria-label={t("connectCodeInput")} placeholder={t("connectCodeInput")} onChange={(e) => setCode(e.target.value)} className={`${field} font-mono`} />
      <select value={linkTo} aria-label={t("connectCodeLinkTo")} onChange={(e) => setLinkTo(e.target.value)} className={field}><option value="">{t("connectCodeNew")}</option>{rows.filter((r) => !r.connected).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <button type="button" disabled={busy || code.trim().length < 24} onClick={async () => { if (await run(() => redeemSupplyCodeAction(code, linkTo || null), t("connectCodeDone"))) { setCode(""); setLinkTo(""); } }} className="min-h-11 w-full rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("connectWithCode")}</button>
    </section>
    <ul className="mb-4 space-y-2">
      {rows.map((r) => <li key={r.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
        <Badge variant={r.connected ? "success" : "default"}>{r.connected ? t("supplierConnected") : t("supplierNotConnected")}</Badge>
        {r.connectionId && <button type="button" disabled={busy} onClick={() => { if (window.confirm(t("confirmDisconnect"))) run(() => revokeConnectionAction(r.connectionId as string)); }} className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold">{t("disconnect")}</button>}
      </li>)}
      {rows.length === 0 && !error && <li className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">{t("noSuppliersYet")}</li>}
    </ul>
    <div className="flex gap-2"><input value={name} maxLength={120} aria-label={t("newSupplierName")} placeholder={t("newSupplierName")} onChange={(e) => setName(e.target.value)} className={field} /><button type="button" disabled={busy || !name.trim()} onClick={async () => { if (await run(() => createSupplierAction(name))) setName(""); }} className="min-h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-40">{t("addSupplier")}</button></div>
  </div>;
}
