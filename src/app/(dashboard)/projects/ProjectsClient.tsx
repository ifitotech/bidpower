"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { SearchInput } from "@/components/ui/SearchInput";
import { usePermissions } from "@/lib/permissions-context";

type Project = { id: string; name: string; status: string; address?: string | null; contract_value: number; budget_total: number; spentTotal: number; costsHidden?: boolean; client?: { name?: string } | null };

const STATUSES = [
  ["lead", "statusLead"],
  ["quoted", "statusQuoted"],
  ["approved", "statusApproved"],
  ["active", "statusActive"],
  ["on_hold", "statusOnHold"],
  ["completed", "statusCompleted"],
  ["cancelled", "statusCancelled"],
] as const;

export default function ProjectsClient({ projects = [], error }: { projects?: Project[]; error?: "errNoSupabase" | "errLoadProjects" }) {
  const { t } = useI18n();
  const { isManagerOrAbove } = usePermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = projects.filter((p) => `${p.name} ${p.client?.name || ""} ${p.address || ""}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || p.status === status));

  return <div className="mx-auto max-w-5xl p-4 md:p-8">
    <PageHeader title={t("projects")} action={isManagerOrAbove ? <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4" />{t("newProject")}</Link> : undefined} />
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t(error)}</div>}
    {projects.length > 0 && <div className="mb-4 flex gap-2">
      <SearchInput value={search} onChange={setSearch} placeholder={t("search")} className="flex-1" />
      <select aria-label={t("statusLabel")} value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 text-sm">
        <option value="all">{t("all")}</option>
        {STATUSES.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
      </select>
    </div>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((p) => {
        const overBudget = p.spentTotal > Number(p.budget_total) && Number(p.budget_total) > 0;
        const progress = Number(p.budget_total) > 0 ? Math.min(100, (p.spentTotal / Number(p.budget_total)) * 100) : 0;
        return <Link key={p.id} href={`/projects/${p.id}`} className="block min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="truncate text-xs text-slate-500">{p.client?.name || "—"}</p></div>
            <ProjectStatusBadge status={p.status} />
          </div>
          {p.address && <p className="mb-2 flex items-center gap-1 truncate text-xs text-slate-400"><MapPin className="h-3.5 w-3.5 shrink-0" />{p.address}</p>}
          {!p.costsHidden && <div className="grid grid-cols-3 gap-2 text-xs">
            <div><p className="text-slate-400">{t("contractValue")}</p><p className="font-semibold">{formatCurrency(Number(p.contract_value))}</p></div>
            <div><p className="text-slate-400">{t("budget")}</p><p className="font-semibold">{formatCurrency(Number(p.budget_total))}</p></div>
            <div><p className="text-slate-400">{t("spent")}</p><p className={`font-semibold ${overBudget ? "text-red-600" : ""}`}>{formatCurrency(p.spentTotal)}</p></div>
          </div>}
          {!p.costsHidden && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${overBudget ? "bg-red-500" : "bg-brand-500"}`} style={{ width: `${progress}%` }} /></div>}
        </Link>;
      })}
    </div>
    {!error && projects.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><p className="font-semibold">{isManagerOrAbove ? t("noProjectsYet") : t("noProjectsAssigned")}</p><p className="mt-1 text-sm text-slate-500">{isManagerOrAbove ? t("noProjectsHint") : t("noProjectsAssignedHint")}</p></div>}
    {projects.length > 0 && filtered.length === 0 && <p className="py-12 text-center text-sm text-slate-400">{t("noResults")}</p>}
  </div>;
}
