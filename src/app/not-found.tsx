"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export default function NotFound() {
  const { t } = useI18n();
  return <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
    <h1 className="text-xl font-bold">{t("notFoundTitle")}</h1>
    <p className="max-w-sm text-sm text-slate-500">{t("notFoundHint")}</p>
    <Link href="/dashboard" className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white">{t("goHome")}</Link>
  </main>;
}
