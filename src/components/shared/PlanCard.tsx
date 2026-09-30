"use client";

import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

type Plan = { name: string; price: string; period?: string; description: keyof Dictionary; features: (keyof Dictionary)[]; cta: keyof Dictionary; current?: boolean; highlighted?: boolean; disabled?: boolean };

const plans: Plan[] = [
  { name: "Free", price: "$0", description: "planFreeDesc", features: ["pfProjects3", "pfEmployees3", "pfQuotes3", "pfBasicDashboard", "pfBudgetVsExpenses"], cta: "currentPlan", current: true },
  { name: "Pro", price: "$49", period: "perMonth", description: "planProDesc", features: ["unlimitedProjects", "unlimitedEmployees", "unlimitedQuotes", "pfExports", "pfAdvancedReports", "pfNotifications", "pfCustomCategories"], cta: "upgradeToPro", highlighted: true },
  { name: "Ultra", price: "$99", period: "perMonth", description: "planUltraDesc", features: ["pfEverythingPro", "pfAI", "pfInvoiceOcr", "pfSmartReports", "pfQuickbooks"], cta: "comingSoon", disabled: true },
];

export function PlanCards() {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`rounded-xl border p-5 flex flex-col ${
            plan.highlighted
              ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/30"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t(plan.description)}</p>
            <p className="mt-3">
              <span className="text-2xl font-bold">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-slate-500">{t(plan.period as keyof Dictionary)}</span>
              )}
            </p>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{t(f)}</span>
              </li>
            ))}
          </ul>
          <Button
            variant={plan.highlighted ? "primary" : "outline"}
            className="w-full"
            disabled={plan.disabled || plan.current}
          >
            {t(plan.cta)}
          </Button>
        </div>
      ))}
    </div>
  );
}
