"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { customerRespondAction } from "./actions";

export type CustomerData = {
  kind: "proposal" | "change_order";
  company: { name: string; phone: string | null; email: string | null };
  project: { name: string; address: string | null } | null;
  recipient: string | null;
  open: boolean;
  can_request_change: boolean;
  doc: {
    number: string; status: string; total: number; title?: string; description?: string | null; version?: number; issue_date?: string; valid_until?: string | null;
    subtotal?: number; tax_amount?: number; discount_amount?: number; terms?: string | null; notes?: string | null; approved_at?: string | null; approved_by_name?: string | null; expired?: boolean;
  };
  items: { description: string; quantity: number; unit_price: number; amount: number }[];
};

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500";
const btn = "min-h-12 rounded-xl px-4 font-semibold disabled:opacity-40";

export default function CustomerView({ token, data }: { token: string; data: CustomerData | null }) {
  const { t } = useI18n();
  const shell = (children: React.ReactNode) => <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3"><Logo variant="mark" className="h-8 w-8" /><span className="flex-1 font-bold">{t("appName")}</span><LanguageSwitcher /></div></header><main className="mx-auto max-w-2xl p-4 pb-16">{children}</main></div>;
  if (!data) return shell(<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errCustomerLink")}</div>);
  return shell(<Body token={token} data={data} />);
}

function Body({ token, data }: { token: string; data: CustomerData }) {
  const { t } = useI18n();
  const d = data.doc;
  const [name, setName] = useState(data.recipient ?? "");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"none" | "changes">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const isProposal = data.kind === "proposal";

  async function send(action: "approve" | "request_changes" | "decline") {
    setBusy(true); setError(null);
    const res = await customerRespondAction(token, action, name, message).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string }));
    setBusy(false);
    if (res.errorCode) { setError(t(res.errorCode as keyof Dictionary)); return; }
    setDone(action === "approve" ? t("custDoneApproved") : action === "request_changes" ? t("custDoneChange") : t("custDoneDeclined"));
  }

  const closedNote = d.expired ? t("custExpired") : d.status === "superseded" ? t("custSuperseded") : !data.open && !data.can_request_change && d.status !== "approved" ? t("custClosed") : null;

  return <>
    <h1 className="text-xl font-bold">{(isProposal ? t("custPageTitle", { company: data.company.name }) : t("custCoTitle", { company: data.company.name }))}</h1>
    <p className="mt-1 text-sm text-slate-500">{d.number}{d.version && d.version > 1 ? ` · ${t("proposalVersion", { version: String(d.version) })}` : ""}{d.title ? ` · ${d.title}` : ""}{data.project?.name ? ` · ${data.project.name}` : ""}</p>
    {data.project?.address && <p className="text-sm text-slate-500">{data.project.address}</p>}
    {isProposal && d.valid_until && <p className="mt-1 text-xs text-slate-400">{t("custValidUntil", { date: formatDate(d.valid_until) })}</p>}
    {d.description && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">{d.description}</p>}

    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <ul className="divide-y divide-slate-100">{data.items.map((i, idx) => <li key={idx} className="flex items-start gap-3 py-2 text-sm"><div className="min-w-0 flex-1"><p className="break-words font-medium">{i.description}</p><p className="text-xs text-slate-400">{i.quantity} × {formatCurrency(Number(i.unit_price))}</p></div><span className="shrink-0 font-semibold">{formatCurrency(Number(i.amount))}</span></li>)}</ul>
      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
        {isProposal && <><div className="flex justify-between"><span>{t("qSubtotal")}</span><span>{formatCurrency(Number(d.subtotal ?? 0))}</span></div>
          {Number(d.discount_amount ?? 0) > 0 && <div className="flex justify-between"><span>{t("qDiscount")}</span><span>-{formatCurrency(Number(d.discount_amount))}</span></div>}
          <div className="flex justify-between"><span>{t("qTax")}</span><span>{formatCurrency(Number(d.tax_amount ?? 0))}</span></div></>}
        <div className="flex justify-between text-lg font-bold"><span>{isProposal ? t("qTotal") : t("coTotal")}</span><span>{formatCurrency(Number(d.total))}</span></div>
      </div>
    </section>
    {(d.notes || d.terms) && <section className="mt-4 rounded-xl bg-white p-4 text-sm">{d.notes && <p className="whitespace-pre-wrap">{d.notes}</p>}{d.terms && <><p className="mt-3 text-xs font-semibold uppercase text-slate-400">{t("custTerms")}</p><p className="whitespace-pre-wrap text-slate-600">{d.terms}</p></>}</section>}

    {d.status === "approved" && d.approved_by_name && <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{t("custApprovedBy", { name: d.approved_by_name, date: d.approved_at ? formatDate(d.approved_at) : "" })}</div>}
    {closedNote && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{closedNote}</div>}
    {done && <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{done}</div>}
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

    {!done && (data.open || data.can_request_change) && <section className="mt-6 space-y-3">
      <label className="block text-sm font-medium">{t("custYourName")}<input value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} className={`${field} mt-1`} /></label>
      {data.open && mode === "none" && <>
        <p className="text-xs text-slate-500">{t("custApproveHint")}</p>
        <button type="button" disabled={busy || name.trim().length < 2} onClick={() => send("approve")} className={`${btn} w-full bg-brand-600 text-white`}>{t("custApprove")}</button>
        <div className="flex gap-2">{isProposal && <button type="button" disabled={busy} onClick={() => setMode("changes")} className={`${btn} flex-1 border border-slate-200 bg-white`}>{t("custRequestChanges")}</button>}
          <button type="button" disabled={busy || name.trim().length < 2} onClick={() => send("decline")} className={`${btn} flex-1 border border-slate-200 bg-white`}>{t("custDecline")}</button></div>
      </>}
      {(mode === "changes" || (!data.open && data.can_request_change)) && <>
        {!data.open && <p className="text-sm text-slate-600">{t("custRequestAfter")}</p>}
        <label className="block text-sm font-medium">{t("custChangeMessage")}<textarea rows={4} value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} className={`${field} mt-1`} /></label>
        <div className="flex gap-2"><button type="button" disabled={busy || name.trim().length < 2 || !message.trim()} onClick={() => send("request_changes")} className={`${btn} flex-1 bg-brand-600 text-white`}>{t("custSendChange")}</button>
          {data.open && <button type="button" onClick={() => setMode("none")} className={`${btn} border border-slate-200 bg-white`}>{t("cancel")}</button>}</div>
      </>}
    </section>}

    <p className="mt-8 text-xs text-slate-400">{t("custContact")}: {data.company.name}{data.company.phone ? ` · ${data.company.phone}` : ""}{data.company.email ? ` · ${data.company.email}` : ""}</p>
  </>;
}
