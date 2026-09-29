"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { PO_STATUS_KEYS } from "@/lib/po-status";
import type { POStatus } from "@/types/database";
import type { ProjectMoney, TimelineItem, WaitingItem } from "@/lib/services/project-control";

const WAIT_KEYS: Record<string, keyof Dictionary> = { owner: "waitingOwner", employee: "waitingEmployee", supplier: "waitingSupplier", customer: "waitingCustomer" };
const KIND_KEYS: Record<string, keyof Dictionary> = {
  material_request: "kindMaterialRequest", pricing_request: "kindPricingRequest", purchase_order: "kindPurchaseOrder", proposal: "kindProposal", change_order: "kindChangeOrder", change_request: "kindChangeRequest",
};
const REQ_KEYS: Record<string, keyof Dictionary> = { requested: "reqStatusRequested", reviewed: "reqStatusReviewed", rejected: "reqStatusRejected", converted: "reqStatusConverted", cancelled: "reqStatusCancelled" };
const QUOTE_KEYS: Record<string, keyof Dictionary> = {
  draft: "quoteStDraft", sent: "quoteStSent", pending: "quoteStPending", approved: "quoteStApproved", rejected: "quoteStRejected", expired: "quoteStExpired", cancelled: "quoteStCancelled",
  changes_requested: "quoteStChangesRequested", superseded: "quoteStSuperseded",
};
const ACT_KEYS: Record<string, keyof Dictionary> = { approved: "actApproved", changes_requested: "actChangesRequested", declined: "actDeclined" };

export function MoneyPanel({ money: m, budgetSplit }: { money: ProjectMoney; budgetSplit?: { label: string; value: number }[] }) {
  const { t } = useI18n();
  const cell = (label: string, value: string, tone = "") => <div><p className="text-xs text-slate-400">{label}</p><p className={`text-sm font-semibold ${tone}`}>{value}</p></div>;
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="mb-3 font-semibold">{t("projectControl")}</h2>
    <div className="grid grid-cols-2 gap-3">
      {cell(t("moneyContract"), formatCurrency(m.contractValue))}
      {cell(t("moneyBudget"), formatCurrency(m.budgetTotal))}
      {cell(t("moneyActual"), formatCurrency(m.actualCost))}
      {cell(t("moneyCommitted"), formatCurrency(m.committedCost))}
      {cell(t("moneyForecast"), formatCurrency(m.forecastCost), m.overBudget ? "text-red-600" : "")}
      {m.budgetTotal > 0 && cell(t("moneyRemaining"), formatCurrency(m.budgetRemaining), m.budgetRemaining < 0 ? "text-red-600" : "")}
      {m.estimatedProfit !== undefined && cell(t("moneyEstProfit"), `${formatCurrency(m.estimatedProfit)} · ${(m.estimatedMargin ?? 0).toFixed(1)}%`, m.estimatedProfit >= 0 ? "text-green-600" : "text-red-600")}
    </div>
    {m.budgetTotal > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(m.budgetUsage)} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${m.overBudget ? "bg-red-500" : m.nearBudget ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${m.budgetUsage}%` }} /></div>}
    {m.overBudget && <p className="mt-2 text-xs font-semibold text-red-600">{t("moneyOverBudget")}</p>}
    {!m.overBudget && m.nearBudget && <p className="mt-2 text-xs font-semibold text-amber-600">{t("moneyNearBudget")}</p>}
    {m.pendingApprovalCost > 0 && <p className="mt-2 text-xs text-slate-500">{t("moneyPendingApproval", { amount: formatCurrency(m.pendingApprovalCost) })}</p>}
    {budgetSplit && <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">{budgetSplit.map((b) => <div key={b.label}><p className="text-slate-400">{b.label}</p><p className="font-medium">{formatCurrency(b.value)}</p></div>)}</div>}
    <p className="mt-3 text-[11px] text-slate-400">{t("moneyEstimateNote")}</p>
  </section>;
}

export function WaitingPanel({ items }: { items: WaitingItem[] }) {
  const { t } = useI18n();
  const groups = ["owner", "employee", "supplier", "customer"].map((w) => ({ w, list: items.filter((i) => i.waitingOn === w) })).filter((g) => g.list.length > 0);
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="mb-3 font-semibold">{t("waitingOnTitle")}</h2>
    {groups.length === 0 ? <p className="text-sm text-slate-400">{t("nothingWaiting")}</p> :
      <div className="space-y-3">{groups.map((g) => <div key={g.w}><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{t(WAIT_KEYS[g.w])} · {g.list.length}</p>
        <ul className="space-y-1">{g.list.map((i) => <li key={`${i.kind}-${i.id}`}><Link href={i.href} className="flex min-h-9 items-center gap-2 text-sm hover:text-brand-700"><span className="text-slate-500">{t(KIND_KEYS[i.kind])}</span><span className="truncate font-medium">{i.label}</span></Link></li>)}</ul></div>)}</div>}
  </section>;
}

function describe(i: TimelineItem, t: (k: keyof Dictionary, v?: Record<string, string>) => string): string {
  const status = (map: Record<string, keyof Dictionary>, key: string | null) => (key && map[key] ? t(map[key]) : key ?? "");
  switch (i.kind) {
    case "material_request_created": return t("tlMRCreated", { label: i.label });
    case "material_request_reviewed": return t("tlMRReviewed", { label: i.label, status: status(REQ_KEYS, i.detail) });
    case "pricing_request_created": return t("tlPRCreated", { label: i.label });
    case "pricing_request_sent": return t("tlPRSent", { label: i.label });
    case "pricing_request_responded": return t("tlPRResponded", { label: i.label });
    case "purchase_order_status": return t("tlPO", { label: i.label, status: i.detail && PO_STATUS_KEYS[i.detail as POStatus] ? t(PO_STATUS_KEYS[i.detail as POStatus] as keyof Dictionary) : i.detail ?? "" });
    case "proposal_status": return t("tlProposal", { label: i.label, status: status(QUOTE_KEYS, i.detail) });
    case "customer_action": return t("tlCustomer", { label: i.label, status: status(ACT_KEYS, i.detail) });
    case "change_order_created": return t("tlCOCreated", { label: i.label });
    case "expense_recorded": return t("tlExpense", { label: i.label });
    default: return i.label;
  }
}

export function ActivityPanel({ items }: { items: TimelineItem[] }) {
  const { t } = useI18n();
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="mb-3 font-semibold">{t("projectActivity")}</h2>
    {items.length === 0 ? <p className="text-sm text-slate-400">{t("noActivityYet")}</p> :
      <ul className="space-y-2">{items.map((i, idx) => { const text = describe(i, t); return <li key={`${i.refId}-${i.kind}-${idx}`} className="text-sm">
        {i.href ? <Link href={i.href} className="hover:text-brand-700">{text}</Link> : text}
        <span className="block text-xs text-slate-400">{formatDate(i.at)}{i.actor ? ` · ${i.actor}` : ""}</span></li>; })}</ul>}
  </section>;
}
