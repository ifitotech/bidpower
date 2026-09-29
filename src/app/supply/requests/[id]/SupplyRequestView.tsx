"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { SupplierRequestForm, type SupplierData } from "@/components/supplier/SupplierRequestForm";
import { supplyAskAction, supplyFileUrlAction, supplyRespondAction } from "../../actions";

export default function SupplyRequestView({ invitationId, data }: { invitationId: string; data: SupplierData }) {
  const { t } = useI18n();
  async function openFile(path: string) {
    const res = await supplyFileUrlAction(path).catch(() => ({ errorCode: "errGeneric" } as { errorCode?: string; url?: string }));
    if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    else window.alert(t("errForbidden"));
  }
  return <div className="p-4 md:p-6">
    <Link href="/supply" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />{t("back")}</Link>
    <SupplierRequestForm data={data} onSubmit={(p) => supplyRespondAction(invitationId, p)} onAsk={(b) => supplyAskAction(invitationId, b)} onOpenFile={openFile} />
  </div>;
}
