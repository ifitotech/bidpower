"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardList, FileText, FolderOpen, MapPin, Pencil, Plus, Receipt, ShoppingCart, User } from "lucide-react";
import { ProjectStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Project = {
  id: string; name: string; status: string; description?: string | null; address?: string | null; start_date?: string | null;
  contract_value: number; budget_total: number; budget_materials: number; budget_labor: number; budget_subcontractors: number; budget_other: number;
  spentTotal: number; profit: number; margin: number; overBudget: boolean;
  client?: { name?: string; contact_name?: string | null; phone?: string | null } | null;
  expenses?: { id: string; amount: number; vendor_name?: string | null; category?: { name?: string } | null }[];
};

export default function ProjectDetailClient({ project: p, error }: { project?: Project; error?: "errNoSupabase" | "errLoadProject" }) {
  const { t, locale } = useI18n();
  const back = <Link href="/projects" aria-label={t("projects")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>;

  if (!p) {
    return <div className="mx-auto max-w-4xl p-4 md:p-8"><div className="mb-6">{back}</div>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t(error)}</div>}</div>;
  }

  const progress = p.budget_total > 0 ? Math.min(100, (p.spentTotal / p.budget_total) * 100) : 0;
  const tools = [
    { href: "/expenses", label: t("expenses"), icon: Receipt },
    { href: "/pos", label: t("toolPOs"), icon: ShoppingCart },
    { href: "/quotes", label: t("toolQuotes"), icon: FileText },
    { href: "/invoices", label: t("toolInvoices"), icon: ClipboardList },
    { href: "/files", label: t("toolFiles"), icon: FolderOpen },
    { href: "/calendar", label: t("calendar"), icon: CalendarDays },
  ];

  return <div className="mx-auto max-w-4xl p-4 md:p-8">
    <div className="mb-6 flex items-start gap-3">
      {back}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{p.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <ProjectStatusBadge status={p.status} />
          {p.client?.name && <span className="inline-flex min-w-0 items-center gap-1"><User className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{p.client.name}</span></span>}
          {p.address && <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{p.address}</span></span>}
        </div>
      </div>
      <Link href={`/projects/${p.id}/edit`} aria-label={t("editProject")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><Pencil className="h-4 w-4" /></Link>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">{t("projectInfo")}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("contractValue")}</dt><dd className="font-semibold">{formatCurrency(Number(p.contract_value))}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("profit")}</dt><dd className={`font-semibold ${p.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(p.profit)} · {p.margin.toFixed(1)}%</dd></div>
          {p.start_date && <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("startDate")}</dt><dd className="font-medium">{formatDate(p.start_date, locale)}</dd></div>}
          {p.client?.contact_name && <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("contactPerson")}</dt><dd className="font-medium">{p.client.contact_name}</dd></div>}
          {p.client?.phone && <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("phone")}</dt><dd className="font-medium">{p.client.phone}</dd></div>}
        </dl>
        {p.description && <div className="mt-4 border-t border-slate-100 pt-3"><p className="mb-1 text-xs font-semibold uppercase text-slate-400">{t("notes")}</p><p className="whitespace-pre-line text-sm text-slate-700">{p.description}</p></div>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">{t("budgetVsExpenses")}</h2>
        <div className="flex justify-between text-sm"><span className="text-slate-500">{t("budget")}</span><span className="font-medium">{formatCurrency(Number(p.budget_total))}</span></div>
        <div className="mt-2 flex justify-between text-sm"><span className="text-slate-500">{t("spent")}</span><span className={`font-medium ${p.overBudget ? "text-red-600" : ""}`}>{formatCurrency(p.spentTotal)}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${p.overBudget ? "bg-red-500" : "bg-brand-500"}`} style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><p className="text-slate-400">{t("materials")}</p><p className="font-medium">{formatCurrency(Number(p.budget_materials))}</p></div>
          <div><p className="text-slate-400">{t("labor")}</p><p className="font-medium">{formatCurrency(Number(p.budget_labor))}</p></div>
          <div><p className="text-slate-400">{t("subcontractors")}</p><p className="font-medium">{formatCurrency(Number(p.budget_subcontractors))}</p></div>
          <div><p className="text-slate-400">{t("other")}</p><p className="font-medium">{formatCurrency(Number(p.budget_other))}</p></div>
        </div>
      </section>
    </div>

    <section className="mt-4">
      <h2 className="mb-2 font-semibold">{t("projectTools")}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tools.map((tool) => <Link key={tool.href} href={tool.href} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-medium transition hover:border-brand-300"><tool.icon className="h-5 w-5 shrink-0 text-brand-600" /><span className="truncate">{tool.label}</span></Link>)}
      </div>
    </section>

    <section className="mt-4">
      <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">{t("projectExpenses")}</h2><Link href="/expenses/new" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"><Plus className="h-3.5 w-3.5" />{t("newExpense")}</Link></div>
      <div className="divide-y divide-slate-50 rounded-xl border border-slate-200 bg-white">
        {(p.expenses || []).length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-400">{t("noResults")}</div> : p.expenses?.map((e) => <div key={e.id} className="flex justify-between gap-3 px-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-medium">{e.vendor_name || t("vendor")}</p><p className="truncate text-xs text-slate-500">{e.category?.name || t("category")}</p></div><p className="font-semibold">{formatCurrency(Number(e.amount))}</p></div>)}
      </div>
    </section>
  </div>;
}
