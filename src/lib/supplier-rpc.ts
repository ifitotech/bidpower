// Shared by the secure link and the Supply account: same payload, same database rules, same error keys.
import type { SupplierPayload } from "@/components/supplier/SupplierRequestForm";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Database messages -> translated keys. Anything else is generic (details are not shown to Supply). */
export function supplierErrorCode(message: string): string {
  if (message.includes("invalid_link")) return "errSupplierLink";
  if (message.includes("request_closed") || message.includes("response_locked")) return "supplierClosed";
  if (message.includes("response_empty")) return "errResponseEmpty";
  if (message.includes("too_many")) return "errTooMany";
  if (message.includes("forbidden") || message.includes("not_supply")) return "errForbidden";
  if (message.includes("code_invalid")) return "errCodeInvalid";
  return "errGeneric";
}

export function toRpcPayload(input: SupplierPayload) {
  return {
    contact_name: String(input.contactName ?? "").slice(0, 120), quote_number: String(input.quoteNumber ?? "").slice(0, 60),
    total_amount: num(input.totalAmount), freight: num(input.freight), tax_amount: num(input.taxAmount), expires_on: input.expiresOn || null,
    notes: String(input.notes ?? "").slice(0, 2000),
    lines: input.lines.slice(0, 300).map((l) => ({
      request_item_id: l.requestItemId, unit_price: num(l.unitPrice), availability: l.availability || null,
      lead_time: String(l.leadTime ?? "").slice(0, 80) || null, notes: String(l.notes ?? "").slice(0, 500) || null,
    })),
  };
}
