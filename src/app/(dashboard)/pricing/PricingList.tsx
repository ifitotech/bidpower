"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";
import { formatDate } from "@/lib/utils";
import { PRICING_TYPES } from "@/lib/pricing";
import { PricingStatusBadge } from "@/components/shared/PricingStatusBadge";
import { WaitingOn } from "@/components/shared/RequestStatusBadge";
import type { PricingRow } from "@/lib/services/pricing-requests";

export default function PricingList({ requests, error = false }: { requests: PricingRow[]; error?: boolean }) {
  const { t } = useI18n();
  const { permissions } = usePermissions();
  const typeLabel = (code: string) => { const x = PRICING_TYPES.find((p) => p.code === code); return x ? t(x.key) : code; };
  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-5 flex items-center gap-3">
      <h1 className="min-w-0 flex-1 text-xl font-bold">{t("pricingRequests")}</h1>
      {permissions.can_create_pricing_request && <Link href="/pricing/new" className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("newPricingRequest")}</span></Link>}
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errLoadMaterials")}</div>}
    {!error && requests.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="font-semibold">{t("noPricingRequests")}</p><p className="mt-1 text-sm text-slate-500">{t("noPricingRequestsHint")}</p></div> :
      <ul className="space-y-2">{requests.map((r) => <li key={r.id}><Link href={`/pricing/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-500">
        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{r.number}</span><PricingStatusBadge status={r.status} /><span className="text-xs text-slate-400">{typeLabel(r.request_type)}</span></div>
        <p className="mt-1 truncate text-sm text-slate-600">{[r.title, r.project?.name].filter(Boolean).join(" · ")}{" "}<span className="text-slate-400">· {t("itemsCount", { count: String(r.itemCount) })}</span></p>
        <p className="mt-0.5 text-xs text-slate-400">{r.response_due_date ? `${t("bidDate")} ${formatDate(r.response_due_date)} · ` : ""}{t("waitingOn")}: <WaitingOn value={r.waiting_on} />{r.responseCount > 0 ? ` · ${t("supplierResponses")}: ${r.responseCount}` : ""}</p>
      </Link></li>)}</ul>}
  </div>;
}
