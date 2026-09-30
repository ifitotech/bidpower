"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { PRICING_TYPES } from "@/lib/pricing";

export type InboxRow = {
  invitation_id: string; contractor_name: string; request_number: string; title: string | null; request_type: string; bid_date: string | null; request_status: string;
  item_count: number; received_at: string; opened_at: string | null; response_status: string | null; quote_number: string | null; quote_total: number | null; question_count: number;
};

const CLOSED = ["awarded", "closed", "cancelled", "converted_to_po", "accepted", "declined", "expired"];

export default function SupplyInbox({ rows, error = false }: { rows: InboxRow[]; error?: boolean }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("todo");
  const today = new Date().toISOString().slice(0, 10);
  const stateOf = (r: InboxRow) => {
    if (r.response_status === "accepted") return "awarded";
    if (r.response_status === "declined") return "lost";
    if (CLOSED.includes(r.request_status) && !r.response_status) return "closed";
    if (r.response_status) return "quoted";
    return "todo";
  };
  const filtered = rows.filter((r) => filter === "all" || (filter === "todo" ? stateOf(r) === "todo" : filter === "quoted" ? ["quoted", "awarded", "lost"].includes(stateOf(r)) : stateOf(r) === filter));
  const todo = rows.filter((r) => stateOf(r) === "todo").length;
  const typeLabel = (c: string) => { const x = PRICING_TYPES.find((p) => p.code === c); return x ? t(x.key) : c; };
  const dueBadge = (r: InboxRow) => {
    if (!r.bid_date || stateOf(r) !== "todo") return null;
    if (r.bid_date < today) return <Badge variant="danger">{t("attnPROverdueShort")}</Badge>;
    if (r.bid_date === today) return <Badge variant="danger">{t("dueTodayShort")}</Badge>;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    return r.bid_date === tomorrow ? <Badge variant="warning">{t("dueTomorrowShort")}</Badge> : null;
  };
  return <div className="p-4 md:p-6">
    <h1 className="text-xl font-bold">{t("supplyInbox")}</h1>
    <p className="mb-4 text-sm text-slate-500">{t("supplyInboxHint")}{todo > 0 ? ` · ${t("supplyToQuote", { count: String(todo) })}` : ""}</p>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errGeneric")}</div>}
    <FilterChips value={filter} onChange={setFilter} options={[{ value: "todo", label: t("supplyFilterTodo") }, { value: "quoted", label: t("supplyFilterQuoted") }, { value: "all", label: t("all") }]} />
    <ul className="mt-4 space-y-2">
      {filtered.map((r) => <li key={r.invitation_id}><Link href={`/supply/requests/${r.invitation_id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-500">
        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{r.contractor_name}</span><span className="text-xs text-slate-400">{r.request_number} · {typeLabel(r.request_type)}</span>{dueBadge(r)}
          {stateOf(r) === "awarded" && <Badge variant="success">{t("awarded")}</Badge>}{stateOf(r) === "lost" && <Badge variant="default">{t("supplyLost")}</Badge>}{stateOf(r) === "quoted" && <Badge variant="info">{t("supplyQuoted")}</Badge>}</div>
        <p className="mt-1 truncate text-sm text-slate-600">{r.title ? `${r.title} · ` : ""}{t("itemsCount", { count: String(r.item_count) })}</p>
        <p className="mt-0.5 text-xs text-slate-400">{r.bid_date ? `${t("bidDate")} ${formatDate(r.bid_date)} · ` : ""}{formatDate(r.received_at)}{r.quote_number ? ` · ${r.quote_number}` : ""}{r.quote_total != null ? ` · ${formatCurrency(Number(r.quote_total))}` : ""}</p>
      </Link></li>)}
      {filtered.length === 0 && !error && <li className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-400">{t("supplyInboxEmpty")}</li>}
    </ul>
  </div>;
}
