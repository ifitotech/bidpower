"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { createPOAction } from "@/app/(dashboard)/actions";

export default function NewPOForm({ projects, canCreate, poLimit }: { projects: { id: string; name: string }[]; canCreate: boolean; poLimit: number | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createPOAction(new FormData(e.currentTarget));
      // On success the server action redirects to /pos.
      if (result?.errorCode) {
        setError(t(result.errorCode as keyof Dictionary));
        setSaving(false);
      }
    } catch {
      setError(t("errGeneric"));
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold">{t("newPO")}</h1>
      </div>

      {!canCreate && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{t("errPoNotAllowed")}</div>}
      {canCreate && poLimit !== null && <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{t("poLimitNotice", { limit: String(poLimit) })}</div>}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>{t("mustUploadDoc")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
      >
        <Select
          label={t("navProjects")}
          name="projectId"
          required
          options={[{ value: "", label: "..." }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
        />
        <Input name="vendorName" label={t("vendor")} placeholder="Home Depot" required />
        <Select
          label={t("category")}
          name="category"
          options={[
            { value: "materials", label: t("materials") },
            { value: "tools", label: t("expCatTools") },
            { value: "sub", label: t("subcontractors") },
            { value: "other", label: t("other") },
          ]}
        />
        <Input
          label={t("estimatedAmount")}
          name="estimatedAmount"
          type="number"
          step="0.01"
          placeholder="0.00"
        />
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            {t("description")}
          </label>
          <textarea
            name="description"
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button type="submit" size="lg" className="w-full" loading={saving} disabled={!canCreate}>
          {t("create")} PO
        </Button>
      </form>
    </div>
  );
}
