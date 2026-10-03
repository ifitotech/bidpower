"use client";

import { confirmAsk } from "@/lib/confirm";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Trash2 } from "lucide-react";
import { QuoteStatusBadge } from "@/components/shared/StatusBadge";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { Badge } from "@/components/ui/Badge";
import type { ActionView, ChangeOrderView, LinkView, getProposalExtras } from "@/lib/services/proposals";
import {
  cancelChangeOrderAction, createChangeOrderAction, createCustomerLinkAction, declineChangeRequestAction, manualDecisionAction, newProposalVersionAction, revokeCustomerLinkAction,
} from "../proposal-actions";

type Extras = Awaited<ReturnType<typeof getProposalExtras>>;
type Quote = { id: string; status: string; number: string; version: number; clientName: string };
const btn = "min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-40";
const field = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-base outline-none focus:border-brand-500";
const ACT_KEYS: Record<string, keyof Dictionary> = { viewed: "actViewed", approved: "actApproved", changes_requested: "actChangesRequested", declined: "actDeclined" };
const CO_KEYS: Record<string, keyof Dictionary> = { draft: "coStDraft", sent: "coStSent", approved: "coStApproved", declined: "coStDeclined", cancelled: "coStCancelled" };
const CO_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = { draft: "default", sent: "info", approved: "success", declined: "danger", cancelled: "default" };

export default function ProposalPanel({ quote, extras, canManage }: { quote: Quote; extras: Extras; canManage: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [coForm, setCoForm] = useState<{ requestId: string | null; title: string; description: string; lines: { description: string; quantity: string; unitPrice: string }[] } | null>(null);

  async function run<T extends { errorCode?: string }>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true); setError(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }) as T);
    setBusy(false);
    if (res.errorCode) { setError(t(res.errorCode as keyof Dictionary)); router.refresh(); return null; }
    router.refresh();
    return res;
  }

  const linkable = ["draft", "sent", "pending", "approved"].includes(quote.status);
  const versionable = ["sent", "pending", "changes_requested", "rejected", "expired"].includes(quote.status);
  const num = (s: string) => Number(s.replace(",", "."));
  const live = (l: LinkView) => !l.revoked_at && new Date(l.expires_at) > new Date();

  function LinkForm({ objectType, objectId, label }: { objectType: "proposal" | "change_order"; objectId: string; label: string }) {
    const [name, setName] = useState(objectType === "proposal" ? quote.clientName : "");
    const [email, setEmail] = useState("");
    return <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">{t("customerName")}<input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className={`${field} mt-1`} /></label>
      <label className="block text-sm font-medium">{t("customerEmailOptional")}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1`} /></label>
      <button type="button" disabled={busy} onClick={async () => { const res = await run(() => createCustomerLinkAction(quote.id, objectType, objectId, { recipientName: name, recipientEmail: email || null })); if (res?.token) setFresh({ label, url: `${window.location.origin}/customer/${res.token}` }); }} className={`${btn} bg-brand-600 text-white sm:col-span-2`}>{t("createCustomerLink")}</button>
    </div>;
  }

  const linkList = (links: LinkView[]) => links.length > 0 && <ul className="mt-2 space-y-1.5">{links.map((l) => <li key={l.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><span className="min-w-0 flex-1 truncate font-medium">{l.recipient_name || "—"}</span><span className="text-slate-400">{l.revoked_at ? t("linkRevoked") : l.last_used_at ? t("linkOpened", { date: formatDate(l.last_used_at) }) : t("linkNotOpened")}</span>{live(l) && canManage && <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("confirmRevokeLink"))) run(() => revokeCustomerLinkAction(quote.id, l.id)); }} className="min-h-9 rounded-lg border border-slate-200 px-2 font-semibold">{t("revokeLink")}</button>}</li>)}</ul>;

  const activity = (list: ActionView[]) => list.length > 0 && <ul className="mt-2 space-y-1 text-xs text-slate-500">{list.map((a) => <li key={a.id}><span className="font-medium text-slate-700">{t(ACT_KEYS[a.action])}</span>{a.customer_name ? ` · ${a.customer_name}` : ""} · {formatDate(a.created_at)}{a.ip && a.action !== "viewed" ? ` · ${t("actIp", { ip: a.ip })}` : ""}{a.message ? ` — ${a.message}` : ""}</li>)}</ul>;

  const totalCo = coForm ? coForm.lines.reduce((s, l) => s + (Number.isFinite(num(l.quantity) * num(l.unitPrice)) ? num(l.quantity) * num(l.unitPrice) : 0), 0) : 0;

  return <div className="space-y-8">
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

    {extras.versions.length > 1 && <section><h2 className="mb-2 font-semibold">{t("proposalVersions")}</h2>
      <ul className="space-y-1.5 text-sm">{extras.versions.map((v) => <li key={v.id}>{v.id === quote.id ? <span className="font-semibold">{t("proposalVersion", { version: String(v.version) })}</span> : <Link href={`/quotes/${v.id}`} className="text-brand-700 underline">{t("proposalVersion", { version: String(v.version) })}</Link>} <span className="text-slate-400">· {formatCurrency(v.total)} · </span><QuoteStatusBadge status={v.status} /></li>)}</ul></section>}

    {canManage && <section>
      <h2 className="mb-2 font-semibold">{t("customerLinks")}</h2>
      {quote.status !== "draft" && !["approved", "rejected", "cancelled", "superseded"].includes(quote.status) && <p className="mb-2 text-xs text-slate-500">{t("proposalLocked")}</p>}
      {fresh && <div className="mb-3 rounded-xl border border-green-300 bg-green-50 p-3">
        <p className="text-sm font-semibold">{fresh.label}</p>
        <p className="mt-1 break-all rounded-lg bg-white p-2 text-xs">{fresh.url}</p>
        <p className="mt-1 text-xs text-slate-600">{t("customerLinkHint")}</p>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(fresh.url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError(t("errGeneric")); } }} className="mt-2 flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white"><Copy className="h-4 w-4" />{copied ? t("prCopied") : t("copyLink")}</button>
      </div>}
      {linkable && <LinkForm objectType="proposal" objectId={quote.id} label={t("customerLink")} />}
      {linkList(extras.links)}
      <div className="mt-3 flex flex-wrap gap-2">
        {versionable && <button type="button" disabled={busy} onClick={async () => { if (!(await confirmAsk(t("confirmNewVersion")))) return; const res = await run(() => newProposalVersionAction(quote.id)); if (res?.id) router.push(`/quotes/${res.id}`); }} className={`${btn} border border-slate-200`}>{t("newProposalVersion")}</button>}
      </div>
      {["sent", "pending"].includes(quote.status) && <details className="mt-3 text-sm"><summary className="cursor-pointer text-slate-500">{t("manualDecision")}</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("confirmManual"))) run(() => manualDecisionAction(quote.id, "approved")); }} className={`${btn} border border-slate-200`}>{t("manualApprove")}</button>
          <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("confirmManual"))) run(() => manualDecisionAction(quote.id, "rejected")); }} className={`${btn} border border-slate-200`}>{t("manualReject")}</button>
        </div></details>}
    </section>}

    {(extras.actions.length > 0) && <section><h2 className="mb-1 font-semibold">{t("customerActivity")}</h2>{activity(extras.actions)}{extras.actions.some((a) => a.action === "approved") && <p className="mt-2 text-xs text-slate-400">{t("actNoSignature")}</p>}</section>}

    {(extras.changeRequests.length > 0) && <section><h2 className="mb-2 font-semibold">{t("changeRequests")}</h2>
      <ul className="space-y-2">{extras.changeRequests.map((r) => <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <p className="whitespace-pre-wrap">{r.message}</p>
        <p className="mt-1 text-xs text-slate-400">{r.requested_by_name ? `${r.requested_by_name} · ` : ""}{formatDate(r.created_at)} · {r.status === "open" ? t("changeRequestOpen") : r.status === "declined" ? t("changeRequestDeclined") : t("changeRequestConverted")}</p>
        {canManage && r.status === "open" && <div className="mt-2 flex flex-wrap gap-2">
          {quote.status === "approved" && <button type="button" disabled={busy} onClick={() => setCoForm({ requestId: r.id, title: r.message.slice(0, 80), description: r.message, lines: [{ description: "", quantity: "1", unitPrice: "" }] })} className={`${btn} bg-brand-600 text-white`}>{t("createChangeOrderFromRequest")}</button>}
          <button type="button" disabled={busy} onClick={() => run(() => declineChangeRequestAction(quote.id, r.id))} className={`${btn} border border-slate-200`}>{t("declineChangeRequest")}</button>
        </div>}
      </li>)}</ul></section>}

    {(quote.status === "approved" || extras.changeOrders.length > 0) && <section>
      <div className="mb-2 flex items-center gap-2"><h2 className="flex-1 font-semibold">{t("changeOrders")}</h2>
        {canManage && quote.status === "approved" && !coForm && <button type="button" onClick={() => setCoForm({ requestId: null, title: "", description: "", lines: [{ description: "", quantity: "1", unitPrice: "" }] })} className="flex min-h-10 items-center gap-1 rounded-lg border border-brand-500 bg-brand-50 px-3 text-sm font-semibold text-brand-700"><Plus className="h-4 w-4" />{t("newChangeOrder")}</button>}</div>

      {coForm && <div className="mb-3 space-y-2 rounded-xl border border-brand-500 bg-white p-3">
        <label className="block text-sm font-medium">{t("coTitle")}<input value={coForm.title} maxLength={160} onChange={(e) => setCoForm({ ...coForm, title: e.target.value })} className={`${field} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("coDescription")}<textarea rows={2} value={coForm.description} maxLength={2000} onChange={(e) => setCoForm({ ...coForm, description: e.target.value })} className={`${field} mt-1`} /></label>
        {coForm.lines.map((l, i) => <div key={i} className="grid grid-cols-[1fr_4rem_5.5rem_2.5rem] gap-2">
          <input aria-label={t("itemDescription")} placeholder={t("itemDescription")} value={l.description} onChange={(e) => setCoForm({ ...coForm, lines: coForm.lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} className={field} />
          <input aria-label={t("quantity")} inputMode="decimal" value={l.quantity} onChange={(e) => setCoForm({ ...coForm, lines: coForm.lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)) })} className={field} />
          <input aria-label={t("unitPrice")} inputMode="decimal" placeholder="0.00" value={l.unitPrice} onChange={(e) => setCoForm({ ...coForm, lines: coForm.lines.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)) })} className={field} />
          <button type="button" aria-label={t("removeLine")} disabled={coForm.lines.length === 1} onClick={() => setCoForm({ ...coForm, lines: coForm.lines.filter((_, j) => j !== i) })} className="flex items-center justify-center text-slate-400 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
        </div>)}
        <button type="button" onClick={() => setCoForm({ ...coForm, lines: [...coForm.lines, { description: "", quantity: "1", unitPrice: "" }] })} className="text-sm font-semibold text-brand-700">{t("coAddLine")}</button>
        <p className="text-xs text-slate-500">{t("coLineHint")} {t("coApprovedAdjusts")}</p>
        <p className="text-sm font-bold">{t("coTotal")}: {formatCurrency(totalCo)}</p>
        <div className="flex gap-2"><button type="button" disabled={busy || !coForm.title.trim()} onClick={async () => { const res = await run(() => createChangeOrderAction({ quoteId: quote.id, changeRequestId: coForm.requestId, title: coForm.title, description: coForm.description, lines: coForm.lines.map((l) => ({ description: l.description, quantity: num(l.quantity), unitPrice: num(l.unitPrice) })) })); if (res) setCoForm(null); }} className={`${btn} flex-1 bg-brand-600 text-white`}>{t("coCreate")}</button><button type="button" onClick={() => setCoForm(null)} className={`${btn} border border-slate-200`}>{t("cancel")}</button></div>
      </div>}

      <ul className="space-y-3">{extras.changeOrders.map((co: ChangeOrderView & { actions?: ActionView[] }) => <li key={co.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate font-semibold">{co.number} · {co.title}</span><Badge variant={CO_COLORS[co.status] ?? "default"}>{t(CO_KEYS[co.status])}</Badge><span className="font-bold">{formatCurrency(co.total)}</span></div>
        <ul className="mt-1 text-xs text-slate-500">{co.items.map((i) => <li key={i.id}>{i.description} · {i.quantity} × {formatCurrency(i.unit_price)}</li>)}</ul>
        {co.approved_by_name && <p className="mt-1 text-xs text-green-700">{t("custApprovedBy", { name: co.approved_by_name, date: co.approved_at ? formatDate(co.approved_at) : "" })}</p>}
        {canManage && ["draft", "sent"].includes(co.status) && <div className="mt-2 space-y-2">
          <LinkForm objectType="change_order" objectId={co.id} label={`${t("customerLink")} ${co.number}`} />
          <button type="button" disabled={busy} onClick={async () => { if (await confirmAsk(t("confirmCancelRequest"))) run(() => cancelChangeOrderAction(quote.id, co.id)); }} className={`${btn} border border-red-100 bg-red-50 text-red-600`}>{t("coCancel")}</button>
        </div>}
        {linkList(co.links)}
        {activity(co.actions ?? [])}
      </li>)}</ul></section>}
  </div>;
}
