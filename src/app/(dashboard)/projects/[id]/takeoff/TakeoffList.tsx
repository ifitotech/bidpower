"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import type { TakeoffRow } from "@/lib/services/takeoffs";
import { createTakeoffAction } from "@/app/(dashboard)/takeoffs/actions";

export default function TakeoffList({ projectId, projectName, takeoffs }: { projectId: string; projectName: string; takeoffs: TakeoffRow[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true); setError(null);
    const res = await createTakeoffAction(projectId, title).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; id?: string }));
    setBusy(false);
    if (res.errorCode) { setError(t(res.errorCode as keyof Dictionary)); return; }
    router.push(`/takeoffs/${res.id}`);
  }

  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-4 flex items-center gap-3">
      <Link href={`/projects/${projectId}`} aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0"><h1 className="text-xl font-bold">{t("takeoffs")}</h1><p className="truncate text-sm text-slate-500">{projectName}</p></div>
    </div>
    <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t("tkPrelimBanner")}</p>
    <div className="mb-4 flex gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <input value={title} maxLength={160} aria-label={t("tkTitle")} placeholder={t("tkTitle")} onChange={(e) => setTitle(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-brand-500" />
      <button type="button" disabled={busy || !title.trim()} onClick={create} className="min-h-11 shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("tkCreate")}</button>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    {takeoffs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">{t("noTakeoffs")}</p> :
      <ul className="space-y-2">{takeoffs.map((k) => <li key={k.id}><Link href={`/takeoffs/${k.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-500">
        <div className="min-w-0 flex-1"><p className="font-semibold">{k.number}</p><p className="truncate text-sm text-slate-600">{k.title}</p><p className="text-xs text-slate-400">{formatDate(k.updated_at)}</p></div>
        <Badge variant={k.status === "verified" ? "success" : "warning"}>{k.status === "verified" ? t("tkVerified") : t("tkPrelim")}</Badge>
      </Link></li>)}</ul>}
  </div>;
}
