"use client";

import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency } from "@/lib/utils";
import { invoiceStatusKey } from "@/lib/invoice-status";

type Invoice = { id: string; number: string; status: string; total: number; client?: { name?: string } | null };

export default function InvoicesClient({ invoices, error = false }: { invoices: Invoice[]; error?: boolean }) {
  const { t } = useI18n();
  return <div className="p-4 md:p-8">
    <div className="flex items-center gap-3 mb-6"><div className="flex-1"><h1 className="text-xl font-bold">{t("invoicesTitle")}</h1><p className="text-sm text-slate-500">{t("invoicesSubtitle")}</p></div><Link href="/invoices/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white"><Plus className="w-4 h-4" />{t("newInvoice")}</Link></div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errLoadData")}</div>}
    <div className="space-y-2">{invoices.map((invoice) => <Link href={`/invoices/${invoice.id}`} key={invoice.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50"><Receipt className="h-5 w-5 text-brand-600" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{invoice.number}</p><p className="truncate text-xs text-slate-500">{invoice.client?.name || t("noClient")} · {t(invoiceStatusKey(invoice.status))}</p></div><p className="text-sm font-bold">{formatCurrency(Number(invoice.total))}</p></Link>)}{invoices.length === 0 && !error && <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">{t("noInvoicesYet")}</div>}</div>
  </div>;
}
