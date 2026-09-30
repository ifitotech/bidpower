import type { Dictionary } from "@/lib/i18n/dictionaries/es";

const KEYS: Record<string, keyof Dictionary> = { draft: "invStDraft", sent: "invStSent", partial: "invStPartial", paid: "invStPaid", overdue: "invStOverdue", cancelled: "invStCancelled" };

export function invoiceStatusKey(status: string): keyof Dictionary {
  return KEYS[status] ?? "invStDraft";
}
