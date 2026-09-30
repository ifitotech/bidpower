"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { OnboardingStep } from "@/lib/services/dashboard";

/** First steps for a new Owner. Each step is done when the record really exists; the card disappears when all are done. */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const { t } = useI18n();
  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{t("firstSteps")}</h2>
        <span className="text-xs text-slate-500">{completed}/{steps.length}</span>
      </div>
      <div className="mb-4 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} /></div>
      <ul className="space-y-1">
        {steps.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="flex min-h-10 items-center gap-3 py-1 text-sm hover:text-brand-600">
              {s.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" /> : <Circle className="h-5 w-5 shrink-0 text-slate-300" />}
              <span className={s.done ? "text-slate-400 line-through" : ""}>{t(s.key)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
