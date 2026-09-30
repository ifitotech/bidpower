"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

// There is no automatic plan analysis. The honest tool is the manual takeoff inside a project.
export default function PlanEstimatorPage() {
  const router = useRouter();
  const { t } = useI18n();
  return <div className="mx-auto max-w-2xl p-4 md:p-8">
    <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />{t("back")}</button>
    <h1 className="mb-2 text-xl font-bold">{t("takeoff")}</h1>
    <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("tkNoAutoAnalysis")}</p>
    <Link href="/projects" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white"><Zap className="h-4 w-4" />{t("tkGoToProjects")}</Link>
  </div>;
}
