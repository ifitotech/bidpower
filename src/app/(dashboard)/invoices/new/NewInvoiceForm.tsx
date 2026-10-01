"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createInvoiceAction } from "@/app/(dashboard)/invoices/actions";
import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";

export default function NewInvoiceForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createInvoiceAction(new FormData(event.currentTarget)).catch(() => ({ errorCode: "errGeneric" }));
    if (result?.errorCode) { setError(t(result.errorCode as never)); setSaving(false); }
  }
  return <div className="p-4 md:p-8 max-w-lg mx-auto">
    <div className="flex items-center gap-3 mb-6"><button type="button" aria-label={t("cancel")} onClick={() => router.back()} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button><h1 className="text-lg font-bold">{t("newInvoice")}</h1></div>
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <Input name="number" label={t("invoiceNumber")} placeholder="INV-0001" required />
      <label className="block text-sm font-medium">{t("clientLabel")}
        <select name="clientId" defaultValue="" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base md:text-sm"><option value="">{t("noClient")}</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </label>
      <Input name="dueDate" label={t("dueDate")} type="date" />
      <Input name="description" label={t("invoiceDescription")} placeholder={t("invoiceDescriptionPh")} required />
      <Input name="amount" label={t("amount")} type="number" step="0.01" min="0.01" placeholder="0.00" required />
      <Input name="notes" label={t("notes")} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={saving}>{t("saveDraft")}</Button>
    </form>
  </div>;
}
