"use server";

import { createClient } from "@/lib/supabase/server";

export type SupplierResult = { errorCode?: string; success?: boolean };

const TOKEN = /^[a-f0-9]{64}$/;

// Database messages -> translated keys. Anything else is a generic error (details are not shown to Supply).
function code(message: string): string {
  if (message.includes("invalid_link")) return "errSupplierLink";
  if (message.includes("request_closed") || message.includes("response_locked")) return "supplierClosed";
  if (message.includes("response_empty")) return "errResponseEmpty";
  if (message.includes("too_many")) return "errTooMany";
  if (message.includes("invalid_payload")) return "errGeneric";
  return "errGeneric";
}

export type SupplierPayload = {
  contactName?: string; quoteNumber?: string; totalAmount?: number | null; freight?: number | null; taxAmount?: number | null;
  expiresOn?: string | null; notes?: string;
  lines: { requestItemId: string; unitPrice?: number | null; availability?: string | null; leadTime?: string | null; notes?: string | null }[];
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function submitSupplierResponseAction(token: string, input: SupplierPayload): Promise<SupplierResult> {
  if (!TOKEN.test(token) || !input || !Array.isArray(input.lines)) return { errorCode: "errSupplierLink" };
  if (input.expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn)) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supplier_submit_response", {
    p_token: token,
    p_payload: {
      contact_name: String(input.contactName ?? "").slice(0, 120), quote_number: String(input.quoteNumber ?? "").slice(0, 60),
      total_amount: num(input.totalAmount), freight: num(input.freight), tax_amount: num(input.taxAmount), expires_on: input.expiresOn || null,
      notes: String(input.notes ?? "").slice(0, 2000),
      lines: input.lines.slice(0, 300).map((l) => ({
        request_item_id: l.requestItemId, unit_price: num(l.unitPrice), availability: l.availability || null,
        lead_time: String(l.leadTime ?? "").slice(0, 80) || null, notes: String(l.notes ?? "").slice(0, 500) || null,
      })),
    },
  });
  return error ? { errorCode: code(error.message) } : { success: true };
}

export async function askSupplierQuestionAction(token: string, body: string): Promise<SupplierResult> {
  if (!TOKEN.test(token)) return { errorCode: "errSupplierLink" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supplier_ask_question", { p_token: token, p_body: String(body ?? "").slice(0, 2000) });
  return error ? { errorCode: code(error.message) } : { success: true };
}
