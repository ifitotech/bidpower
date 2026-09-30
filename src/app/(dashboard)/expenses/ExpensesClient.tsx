"use client";

import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterChips";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { categoryLabel } from "@/lib/category-label";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

type Expense = { id: string; vendor_name?: string | null; amount: number; date: string; notes?: string | null; status?: string; category?: { name?: string } | null; project?: { name?: string } | null };
const STATUS_KEYS: Record<string, keyof Dictionary> = { pending_review: "expStPending", approved: "expStApproved", rejected: "expStRejected", cancelled: "reqStatusCancelled", reimbursed: "expStReimbursed" };
const COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = { pending_review: "warning", approved: "success", rejected: "danger", cancelled: "default", reimbursed: "info" };

export default function ExpensesClient({ expenses = [], canCreate = false, error = false }: { expenses?: Expense[]; canCreate?: boolean; error?: boolean }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const pendingCount = expenses.filter((e) => e.status === "pending_review").length;
  const filtered = expenses
    .filter((e) => filter === "all" || e.status === filter)
    .filter((e) => `${e.vendor_name || ""} ${e.notes || ""} ${categoryLabel(e.category?.name, t)} ${e.project?.name || ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="p-4 md:p-8">
    <PageHeader title={t("expenses")} action={canCreate ? <Link href="/expenses/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />{t("newExpense")}</Link> : undefined} />
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errGeneric")}</div>}
    <FilterChips value={filter} onChange={setFilter} options={[{ value: "all", label: t("all") }, { value: "pending_review", label: `${t("expStPending")}${pendingCount ? ` (${pendingCount})` : ""}` }, { value: "approved", label: t("expStApproved") }, { value: "rejected", label: t("expStRejected") }]} />
    <SearchInput value={search} onChange={setSearch} placeholder={t("search")} className="my-4" />
    <div className="space-y-2">
      {filtered.map((e) => <Link key={e.id} href={`/expenses/${e.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-brand-300">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50"><Receipt className="h-5 w-5 text-amber-600" /></div>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{e.vendor_name || t("vendor")}</p><p className="truncate text-xs text-slate-500">{e.project?.name || t("projects")} · {categoryLabel(e.category?.name, t) || t("category")} · {e.date}</p></div>
        <div className="shrink-0 text-right"><p className="text-sm font-bold">{formatCurrency(Number(e.amount))}</p>{e.status && <Badge variant={COLORS[e.status] ?? "default"}>{t(STATUS_KEYS[e.status] ?? "expStPending")}</Badge>}</div>
      </Link>)}
      {filtered.length === 0 && !error && <p className="py-12 text-center text-sm text-slate-400">{t("noResults")}</p>}
    </div>
  </div>;
}
