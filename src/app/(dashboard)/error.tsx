"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

// An error inside a page keeps the menu and navigation: the person can retry or go home without reloading the app.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => { console.error("[dashboard]", error.digest ?? "", error.message); }, [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-8 pt-20 text-center" role="alert">
      <h1 className="text-xl font-bold">{t("errorPageTitle")}</h1>
      <p className="text-sm text-slate-500">{t("errGeneric")}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white">{t("tryAgain")}</button>
        <Link href="/dashboard" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">{t("goHome")}</Link>
      </div>
    </div>
  );
}
