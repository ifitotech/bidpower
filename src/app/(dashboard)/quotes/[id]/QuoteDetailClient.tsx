"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { QuoteStatusBadge } from "@/components/shared/StatusBadge";
import { WaitingOn } from "@/components/shared/RequestStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { getProposalExtras } from "@/lib/services/proposals";
import ProposalPanel from "./ProposalPanel";

type Quote = {
  id: string; number: string; status: string; version?: number; waiting_on?: string; issue_date?: string; valid_until?: string | null; subtotal: number; tax_amount?: number; discount_amount?: number; total: number;
  terms?: string | null; notes?: string | null; client?: { name?: string } | null; project?: { name?: string } | null;
  items?: { id: string; description: string; quantity: number; unit_price: number; amount: number; part_number?: string | null }[];
};

export default function QuoteDetailClient({ quote: q, extras, canManage }: { quote: Quote; extras: Awaited<ReturnType<typeof getProposalExtras>> | null; canManage: boolean }) {
  const { t } = useI18n();
  const items = [...(q.items ?? [])];
  return <div className="mx-auto max-w-2xl p-4 pb-16 md:p-8">
    <div className="mb-6 flex items-center gap-3">
      <Link href="/quotes" aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1"><p className="text-xs text-slate-400">{q.number}{(q.version ?? 1) > 1 ? ` · ${t("proposalVersion", { version: String(q.version) })}` : ""}</p><h1 className="truncate text-lg font-bold">{q.project?.name || q.client?.name || t("proposal")}</h1></div>
      <QuoteStatusBadge status={q.status} />
    </div>
    <div className="mb-4 space-y-2 rounded-xl border border-slate-200 bg-white p-5 text-sm">
      <div className="flex justify-between"><span className="text-slate-500">{t("qClient")}</span><strong>{q.client?.name || "—"}</strong></div>
      <div className="flex justify-between"><span className="text-slate-500">{t("qIssueDate")}</span><span>{q.issue_date || "—"}</span></div>
      <div className="flex justify-between"><span className="text-slate-500">{t("qValidUntil")}</span><span>{q.valid_until || "—"}</span></div>
      {q.waiting_on && q.waiting_on !== "none" && <div className="flex justify-between"><span className="text-slate-500">{t("waitingOn")}</span><span><WaitingOn value={q.waiting_on} /></span></div>}
    </div>
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">{t("qLineItems")}</h2>
      <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b border-slate-50 pb-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{item.description}</p><p className="text-xs text-slate-500">{item.part_number || ""}{item.part_number ? " · " : ""}{item.quantity} × {formatCurrency(Number(item.unit_price))}</p></div><strong className="shrink-0">{formatCurrency(Number(item.amount))}</strong></div>)}</div>
      <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
        <div className="flex justify-between"><span>{t("qSubtotal")}</span><span>{formatCurrency(Number(q.subtotal))}</span></div>
        {Number(q.discount_amount || 0) > 0 && <div className="flex justify-between"><span>{t("qDiscount")}</span><span>-{formatCurrency(Number(q.discount_amount))}</span></div>}
        <div className="flex justify-between"><span>{t("qTax")}</span><span>{formatCurrency(Number(q.tax_amount || 0))}</span></div>
        <div className="flex justify-between text-lg font-bold"><span>{t("qTotal")}</span><span>{formatCurrency(Number(q.total))}</span></div>
      </div>
    </div>
    {(q.notes || q.terms) && <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 text-sm"><p className="whitespace-pre-wrap">{q.notes}</p><p className="mt-3 whitespace-pre-wrap text-slate-500">{q.terms}</p></div>}
    <a href={`/api/quotes/${q.id}/pdf`} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><Download className="h-4 w-4" />PDF</a>
    {extras && <ProposalPanel quote={{ id: q.id, status: q.status, number: q.number, version: q.version ?? 1, clientName: q.client?.name ?? "" }} extras={extras} canManage={canManage} />}
  </div>;
}
