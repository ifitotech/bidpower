"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

const steps: { id: string; label: keyof Dictionary; href: string; done: boolean }[] = [
  { id: "company", label: "stepCreateCompany", href: "/settings", done: true },
  { id: "client", label: "stepAddClient", href: "/clients/new", done: false },
  { id: "project", label: "stepCreateProject", href: "/projects/new", done: false },
  { id: "quote", label: "stepSendQuote", href: "/quotes/new", done: false },
  { id: "expense", label: "stepAddExpense", href: "/expenses/new", done: false },
  { id: "employee", label: "stepInviteEmployee", href: "/employees/invite", done: false },
];

export function OnboardingChecklist() {
  const { t } = useI18n();
  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t("firstSteps")}</h3>
        <span className="text-xs text-slate-500">
          {completed}/{steps.length}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-brand-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-3 py-1.5 text-sm hover:text-brand-600 transition"
            >
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
              <span className={step.done ? "text-slate-400 line-through" : ""}>
                {t(step.label)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
