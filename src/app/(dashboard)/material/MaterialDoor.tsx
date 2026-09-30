"use client";

import Link from "next/link";
import { Briefcase, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export default function MaterialDoor({ projects, canCreateProject }: { projects: { id: string; name: string; client: string | null }[]; canCreateProject: boolean }) {
  const { t } = useI18n();
  return <div className="mx-auto max-w-lg p-4 md:p-8">
    <h1 className="text-xl font-bold">{t("navMaterial")}</h1>
    <p className="mb-4 text-sm text-slate-500">{projects.length === 0 ? (canCreateProject ? t("materialNeedProject") : t("materialNoProjects")) : t("materialWhichProject")}</p>
    {projects.length > 0 && <ul className="space-y-2">{projects.map((p) => <li key={p.id}><Link href={`/projects/${p.id}/materials/new`} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-300"><Briefcase className="h-5 w-5 shrink-0 text-brand-600" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.name}</span>{p.client && <span className="block truncate text-xs text-slate-500">{p.client}</span>}</span><ChevronRight className="h-4 w-4 text-slate-300" /></Link></li>)}</ul>}
    {projects.length === 0 && canCreateProject && <Link href="/projects/new" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 font-semibold text-white">{t("newProject")}</Link>}
  </div>;
}
