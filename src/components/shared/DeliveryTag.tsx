"use client";

import { useI18n } from "@/lib/i18n/provider";

/** Late / due today / due tomorrow for a PO that is still waiting on delivery. Nothing once it is received or closed. */
export function DeliveryTag({ date, status }: { date: string; status: string }) {
  const { t } = useI18n();
  if (status !== "approved" && status !== "sent") return null;
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const [label, cls] = date < iso(now) ? [t("poLate"), "bg-red-100 text-red-700"] : date === iso(now) ? [t("poDueToday"), "bg-amber-100 text-amber-800"] : date === iso(tomorrow) ? [t("poDueTomorrow"), "bg-amber-50 text-amber-700"] : [null, ""];
  return label ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span> : null;
}
