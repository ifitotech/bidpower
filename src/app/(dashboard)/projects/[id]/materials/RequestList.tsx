"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { confirmAsk } from "@/lib/confirm";
import { cancelRequestsAction } from "@/app/(dashboard)/materials/actions";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";
import { formatDate } from "@/lib/utils";
import { RequestStatusBadge, WaitingOn } from "@/components/shared/RequestStatusBadge";
import type { RequestRow } from "@/lib/services/material-requests";

/** Used both inside a project and in the company-wide review list (showProject). */
export default function RequestList({ requests, projectId, projectName, showProject = false, error = false }: { requests: RequestRow[]; projectId?: string; projectName?: string; showProject?: boolean; error?: boolean }) {
  const { t } = useI18n();
  const { permissions } = usePermissions();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const pending = requests.filter((r) => r.status === "requested");
  async function cancelMany(ids: string[], confirmKey: "reqCancelSelectedConfirm" | "reqCancelAllConfirm") {
    if (ids.length === 0 || !(await confirmAsk(t(confirmKey, { count: String(ids.length) })))) return;
    setBusy(true);
    const r = await cancelRequestsAction(ids).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; cancelled?: number }));
    setBusy(false);
    if (r.errorCode) { setNote(t(r.errorCode as never)); return; }
    setNote(t("reqCancelledCount", { count: String(r.cancelled ?? 0) }));
    setPicked(new Set()); setSelecting(false);
    router.refresh();
  }
  const base = (r: RequestRow) => `/projects/${r.project_id}/materials/${r.id}`;
  return <div className="mx-auto max-w-3xl p-4 md:p-8">
    <div className="mb-5 flex items-center gap-3">
      <Link href={projectId ? `/projects/${projectId}` : "/dashboard"} aria-label={t("back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
      <div className="min-w-0 flex-1"><h1 className="text-xl font-bold">{t("materialRequests")}</h1>{projectName && <p className="truncate text-sm text-slate-500">{projectName}</p>}</div>
      {projectId && permissions.can_request_material && <Link href={`/projects/${projectId}/materials/new`} className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"><PackagePlus className="h-4 w-4" /><span className="hidden sm:inline">{t("newMaterialRequest")}</span></Link>}
    </div>
    {pending.length > 1 && <div className="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => { setSelecting((v) => !v); setPicked(new Set()); }} aria-pressed={selecting} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">{selecting ? t("libSelectDone") : t("libSelect")}</button>
      {!selecting && <button type="button" disabled={busy} onClick={() => cancelMany(pending.map((r) => r.id), "reqCancelAllConfirm")} className="min-h-10 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 disabled:opacity-40">{t("reqCancelAll")}</button>}
      {selecting && <>
        <button type="button" onClick={() => setPicked(new Set(pending.map((r) => r.id)))} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold">{t("libSelectAll", { count: String(pending.length) })}</button>
        <button type="button" disabled={busy || picked.size === 0} onClick={() => cancelMany([...picked], "reqCancelSelectedConfirm")} className="ml-auto min-h-10 rounded-xl bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-40">{t("reqCancelSelected", { count: String(picked.size) })}</button>
      </>}
    </div>}
    {note && <p role="status" className="mb-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{note}</p>}
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("errLoadMaterials")}</div>}
    {!error && requests.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="font-semibold">{t("noMaterialRequests")}</p><p className="mt-1 text-sm text-slate-500">{t("noMaterialRequestsHint")}</p></div> :
      <ul className="space-y-2">{requests.map((r) => <li key={r.id} className="flex items-start gap-2">
        {selecting && r.status === "requested" && <input type="checkbox" aria-label={r.number} checked={picked.has(r.id)} onChange={(e) => setPicked((prev) => { const n = new Set(prev); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n; })} className="mt-5 h-5 w-5 shrink-0" />}
        <Link href={base(r)} className="block min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-500">
        <div className="flex items-center gap-2"><span className="font-semibold">{r.number}</span><RequestStatusBadge status={r.status} /></div>
        <p className="mt-1 text-sm text-slate-600">{showProject && r.project?.name ? `${r.project.name} · ` : ""}{t("itemsCount", { count: String(r.itemCount) })}{r.requester?.full_name ? ` · ${t("requestedBy", { name: r.requester.full_name })}` : ""}</p>
        <p className="mt-0.5 text-xs text-slate-400">{formatDate(r.created_at)}{r.needed_by ? ` · ${t("neededBy")} ${formatDate(r.needed_by)}` : ""} · {t("waitingOn")}: <WaitingOn value={r.waiting_on} /></p>
      </Link></li>)}</ul>}
  </div>;
}
