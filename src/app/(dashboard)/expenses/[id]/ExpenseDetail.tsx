"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { categoryLabel } from "@/lib/category-label";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import type { getExpenseById } from "@/lib/services/expenses";
import { cancelExpenseAction, getReceiptUrlAction, reviewExpenseAction } from "../actions";

type Expense = NonNullable<Awaited<ReturnType<typeof getExpenseById>>>;
const STATUS_KEYS: Record<string, keyof Dictionary> = { pending_review: "expStPending", approved: "expStApproved", rejected: "expStRejected", cancelled: "reqStatusCancelled", reimbursed: "expStReimbursed", draft: "expStPending" };
const COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = { pending_review: "warning", approved: "success", rejected: "danger", cancelled: "default", reimbursed: "info", draft: "default" };
const btn = "min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-40";

export default function ExpenseDetail({ expense: e, isReviewer, canCancel, receiptFailed }: { expense: Expense; isReviewer: boolean; canCancel: boolean; receiptFailed: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(receiptFailed ? t("errGeneric") : null);
  const pending = e.status === "pending_review";

  async function run(fn: () => Promise<{ errorCode?: string }>) {
    setBusy(true); setError(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }));
    if (res.errorCode) setError(t(res.errorCode as keyof Dictionary));
    setBusy(false);
    router.refresh();
  }
  async function openDoc(id: string) {
    const res = await getReceiptUrlAction(id).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; url?: string }));
    if (res.errorCode || !res.url) { setError(t((res.errorCode ?? "errGeneric") as keyof Dictionary)); return; }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return <div className="mx-auto max-w-lg p-4 md:p-8">
    <div className="mb-6 flex items-center gap-3">
      <Link href="/expenses" aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1"><p className="text-xs text-slate-400">{formatDate(e.date)}</p><h1 className="truncate text-lg font-bold">{e.vendor_name || t("vendor")}</h1></div>
      <Badge variant={COLORS[e.status] ?? "default"}>{t(STATUS_KEYS[e.status] ?? "expStPending")}</Badge>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm">
      <div className="flex justify-between"><span className="text-slate-500">{t("amount")}</span><strong className="text-lg">{formatCurrency(e.amount)}</strong></div>
      <div className="flex justify-between"><span className="text-slate-500">{t("navProjects")}</span><span>{e.project ? <Link href={`/projects/${e.project.id}`} className="text-brand-700 underline">{e.project.name}</Link> : "—"}</span></div>
      <div className="flex justify-between"><span className="text-slate-500">{t("category")}</span><span>{categoryLabel(e.category?.name, t) || "—"}</span></div>
      <div className="flex justify-between"><span className="text-slate-500">{t("employees")}</span><span>{e.creator?.full_name ?? "—"}</span></div>
      {e.purchase_order_id && <div className="flex justify-between"><span className="text-slate-500">{t("kindPurchaseOrder")}</span><Link href={`/pos/${e.purchase_order_id}`} className="text-brand-700 underline">{e.notes ?? "PO"}</Link></div>}
      {e.notes && !e.purchase_order_id && <p className="whitespace-pre-wrap border-t border-slate-100 pt-3 text-slate-700">{e.notes}</p>}
    </div>
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-2 font-semibold">{t("document")}</h2>
      {e.documents.length === 0 ? <p className="text-sm text-slate-400">{t("poNoDocsYet")}</p> :
        <ul className="space-y-1.5">{e.documents.map((d) => <li key={d.id}><button type="button" onClick={() => openDoc(d.id)} className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-left text-sm"><Paperclip className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1 truncate">{d.name}</span></button></li>)}</ul>}
    </div>
    {pending && isReviewer && <div className="mb-3 flex gap-2"><button type="button" disabled={busy} onClick={() => run(() => reviewExpenseAction(e.id, "approved"))} className={`${btn} flex-1 bg-brand-600 text-white`}>{t("poApprove")}</button><button type="button" disabled={busy} onClick={() => run(() => reviewExpenseAction(e.id, "rejected"))} className={`${btn} flex-1 border border-slate-200`}>{t("poReject")}</button></div>}
    {pending && !isReviewer && <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{t("expenseNeedsReviewNote")}</p>}
    {pending && canCancel && <button type="button" disabled={busy} onClick={() => { if (window.confirm(t("confirmCancelRequest"))) run(() => cancelExpenseAction(e.id)); }} className={`${btn} w-full border border-red-100 bg-red-50 text-red-600`}>{t("cancel")}</button>}
  </div>;
}
