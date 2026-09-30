"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import { PRICING_STATUS_KEYS } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

const COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default", sent: "info", question_open: "warning", responded: "warning", awarded: "success", converted_to_po: "success", closed: "default", cancelled: "default",
};

export function PricingStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = PRICING_STATUS_KEYS[status] as keyof Dictionary | undefined;
  return <Badge variant={COLORS[status] ?? "default"}>{key ? t(key) : status}</Badge>;
}
