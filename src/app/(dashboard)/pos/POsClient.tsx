"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { POStatusBadge } from "@/components/shared/StatusBadge";
import { WaitingOn } from "@/components/shared/RequestStatusBadge";
import { FilterChips } from "@/components/ui/FilterChips";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";

type PO = { id: string; number: string; vendor_name: string; estimated_amount?: number | null; final_amount?: number | null; status: string; waiting_on?: string; project?: { name?: string } | null };

const IN_PROGRESS = ["approved", "sent", "received", "pending_document", "document_uploaded", "pending_review", "exception_requested", "open"];

export default function POsClient({ orders = [], demo = false }: { orders?: PO[]; demo?: boolean }) {
  const { t } = useI18n();
  const { permissions, isManagerOrAbove } = usePermissions();
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : filter === "progress" ? orders.filter((po) => IN_PROGRESS.includes(po.status)) : orders.filter((po) => po.status === filter);
  const toApprove = orders.filter((po) => po.status === "pending_approval").length;
  const options = [
    { value: "all", label: t("all") },
    ...(isManagerOrAbove || toApprove > 0 ? [{ value: "pending_approval", label: `${t("poFilterApproval")}${toApprove ? ` (${toApprove})` : ""}` }] : []),
    { value: "progress", label: t("poFilterOpen") },
    { value: "completed", label: t("completed") },
  ];
  return <div className="p-4 md:p-8">
    <PageHeader title={t("purchaseOrders")} action={permissions.can_create_po ? <Link href="/pos/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white"><Plus className="w-4 h-4" />{t("newPO")}</Link> : undefined} />
    {demo && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errLoadData")}</div>}
    <FilterChips value={filter} onChange={setFilter} options={options} />
    <div className="mt-4 space-y-2">
      {filtered.map((po) => <Link key={po.id} href={`/pos/${po.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 hover:border-brand-300">
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{po.vendor_name}</p><p className="truncate text-xs text-slate-500">{po.number} · {po.project?.name || t("projects")}{po.waiting_on && po.waiting_on !== "none" && !["completed", "cancelled"].includes(po.status) ? <> · {t("waitingOn")}: <WaitingOn value={po.waiting_on} /></> : null}</p></div>
        <div className="shrink-0 text-right"><p className="text-sm font-bold">{formatCurrency(Number((po.final_amount ?? po.estimated_amount) || 0))}</p><POStatusBadge status={po.status} /></div>
      </Link>)}
      {filtered.length === 0 && <p className="py-12 text-center text-sm text-slate-400">{t("noResults")}</p>}
    </div>
  </div>;
}
