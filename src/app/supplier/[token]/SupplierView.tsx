"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { SupplierRequestForm, type SupplierData } from "@/components/supplier/SupplierRequestForm";
import { askSupplierQuestionAction, submitSupplierResponseAction } from "./actions";

export type { SupplierData };

export default function SupplierView({ token, data }: { token: string; data: SupplierData | null }) {
  const { t } = useI18n();
  const shell = (children: React.ReactNode) => <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3"><Logo variant="mark" className="h-8 w-8" /><span className="flex-1 font-bold">{t("appName")}</span><LanguageSwitcher /></div></header><main className="mx-auto max-w-2xl p-4 pb-16">{children}</main></div>;

  if (!data) return shell(<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("supplierLinkInvalid")}</div>);
  return shell(<SupplierRequestForm data={data} onSubmit={(payload) => submitSupplierResponseAction(token, payload)} onAsk={(body) => askSupplierQuestionAction(token, body)} />);
}
