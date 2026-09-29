"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

const KEYS: Record<string, keyof Dictionary> = {
  requested: "reqStatusRequested", reviewed: "reqStatusReviewed", rejected: "reqStatusRejected",
  converted: "reqStatusConverted", cancelled: "reqStatusCancelled",
};
const COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  requested: "warning", reviewed: "success", rejected: "danger", converted: "info", cancelled: "default",
};
const WAITING: Record<string, keyof Dictionary> = {
  owner: "waitingOwner", employee: "waitingEmployee", supplier: "waitingSupplier", customer: "waitingCustomer", none: "waitingNone",
};

export function RequestStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return <Badge variant={COLORS[status] ?? "default"}>{KEYS[status] ? t(KEYS[status]) : status}</Badge>;
}

export function WaitingOn({ value }: { value: string }) {
  const { t } = useI18n();
  return <>{WAITING[value] ? t(WAITING[value]) : value}</>;
}
