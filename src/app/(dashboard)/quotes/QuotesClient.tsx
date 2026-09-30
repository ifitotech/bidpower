"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuoteStatusBadge } from "@/components/shared/StatusBadge";
import { WaitingOn } from "@/components/shared/RequestStatusBadge";
import { FilterChips } from "@/components/ui/FilterChips";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Quote = { id: string; number: string; status: string; total: number; version?: number; waiting_on?: string; client?: { name?: string } | null; project?: { name?: string } | null };

export default function QuotesClient({ quotes = [], canCreate = false, error = false }: { quotes?: Quote[]; canCreate?: boolean; error?: boolean }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("open");
  // Older versions are history: they stay reachable from the current version but do not clutter the list.
  const current = quotes.filter((q) => q.status !== "superseded");
  const filtered = filter === "all" ? current : filter === "open" ? current.filter((q) => ["draft", "sent", "pending", "changes_requested"].includes(q.status)) : current.filter((q) => q.status === filter);
  return <div className="p-4 md:p-8">
    <PageHeader title={t("proposals")} subtitle={t("proposalsSubtitle")} action={canCreate ? <Link href="/quotes/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />{t("newProposal")}</Link> : undefined} />
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errLoadProposals")}</div>}
    <FilterChips value={filter} onChange={setFilter} options={[
      { value: "open", label: t("poFilterOpen") }, { value: "changes_requested", label: t("quoteStChangesRequested") },
      { value: "approved", label: t("statusApproved") }, { value: "rejected", label: t("statusRejected") }, { value: "all", label: t("all") },
    ]} />
    <div className="mt-4 space-y-2">
      {filtered.map((q) => <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-brand-300">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{q.client?.name || t("proposal")}{q.project?.name ? ` · ${q.project.name}` : ""}</p>
          <p className="truncate text-xs text-slate-500">{q.number}{(q.version ?? 1) > 1 ? ` · ${t("proposalVersion", { version: String(q.version) })}` : ""}{q.waiting_on && q.waiting_on !== "none" ? <> · {t("waitingOn")}: <WaitingOn value={q.waiting_on} /></> : null}</p></div>
        <div className="shrink-0 text-right"><p className="text-sm font-bold">{formatCurrency(Number(q.total))}</p><QuoteStatusBadge status={q.status} /></div>
      </Link>)}
      {filtered.length === 0 && !error && <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="font-semibold">{t("noProposals")}</p><p className="mt-1 text-sm text-slate-500">{t("noProposalsHint")}</p></div>}
    </div>
  </div>;
}
