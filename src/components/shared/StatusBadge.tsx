"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/Badge";
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from "@/lib/po-status";
import type { POStatus, QuoteStatus, ProjectStatus } from "@/types/database";

const quoteLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviado",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Expirado",
  cancelled: "Cancelado",
};

const quoteColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default",
  sent: "info",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  expired: "default",
  cancelled: "default",
};

const projectLabelKeys = {
  lead: "statusLead",
  quoted: "statusQuoted",
  approved: "statusApproved",
  active: "statusActive",
  on_hold: "statusOnHold",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
} as const;

const projectColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  lead: "default",
  quoted: "info",
  approved: "info",
  active: "success",
  on_hold: "warning",
  completed: "success",
  cancelled: "default",
};

export function POStatusBadge({ status }: { status: string }) {
  const label = PO_STATUS_LABELS[status as POStatus] ?? status;
  const variant = PO_STATUS_COLORS[status as POStatus] ?? "default";
  return <Badge variant={variant}>{label}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const label = quoteLabels[status] ?? status;
  const variant = quoteColors[status] ?? "default";
  return <Badge variant={variant}>{label}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const key = projectLabelKeys[status as keyof typeof projectLabelKeys];
  const label = key ? t(key) : status;
  const variant = projectColors[status] ?? "default";
  return <Badge variant={variant}>{label}</Badge>;
}
