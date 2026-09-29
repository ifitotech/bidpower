"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { MATERIAL_CATEGORIES } from "@/lib/materials";
import { RequestStatusBadge, WaitingOn } from "@/components/shared/RequestStatusBadge";
import { cancelRequestAction, reviewRequestAction } from "@/app/(dashboard)/materials/actions";
import type { getRequestById } from "@/lib/services/material-requests";

type Request = NonNullable<Awaited<ReturnType<typeof getRequestById>>>;

export default function RequestDetail({ request: r, projectId, canReview, canCancel }: { request: Request; projectId: string; canReview: boolean; canCancel: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = r.status === "requested";
  const catLabel = (code: string | null) => { const c = MATERIAL_CATEGORIES.find((x) => x.code === code); return c ? t(c.key) : null; };

  async function run(fn: () => Promise<{ errorCode?: string }>) {
    setBusy(true); setError(null);
    const res = await fn().catch(() => ({ errorCode: "errGeneric" }));
    if (res.errorCode) setError(t(res.errorCode as keyof Dictionary));
    setBusy(false);
    router.refresh();
  }

  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-5 flex items-start gap-3">
      <Link href={`/projects/${projectId}/materials`} aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">{r.number}</h1><RequestStatusBadge status={r.status} /></div>
        <p className="text-sm text-slate-500">{r.project?.name}{r.requester?.full_name ? ` · ${t("requestedBy", { name: r.requester.full_name })}` : ""}</p>
        <p className="text-xs text-slate-400">{formatDate(r.created_at)}{r.needed_by ? ` · ${t("neededBy")} ${formatDate(r.needed_by)}` : ""} · {t("waitingOn")}: <WaitingOn value={r.waiting_on} /></p>
      </div>
    </div>
    {r.notes && <p className="mb-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{r.notes}</p>}
    {r.review_note && <p className="mb-4 whitespace-pre-wrap rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{r.review_note}</p>}
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{r.items.map((i) => <li key={i.id} className="flex items-start gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1"><p className="break-words font-medium">{i.description}</p><p className="text-xs text-slate-400">{[catLabel(i.category), i.allow_substitution ? t("substitutionOk") : null].filter(Boolean).join(" · ")}</p></div>
      <span className="shrink-0 font-semibold">{i.quantity} {i.unit}</span>
    </li>)}</ul>
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    {pending && canReview && <div className="mt-5 space-y-2">
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder={t("reviewNote")} aria-label={t("reviewNote")} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base" />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run(() => reviewRequestAction(r.id, "reviewed", note))} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-40">{t("markReviewed")}</button>
        <button type="button" disabled={busy} onClick={() => run(() => reviewRequestAction(r.id, "rejected", note))} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-40">{t("sendBack")}</button>
      </div>
    </div>}
    {pending && canCancel && <button type="button" disabled={busy} onClick={() => { if (window.confirm(t("confirmCancelRequest"))) run(() => cancelRequestAction(r.id)); }} className="mt-3 min-h-11 w-full rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-medium text-red-600 disabled:opacity-40">{t("cancelRequest")}</button>}
  </div>;
}
