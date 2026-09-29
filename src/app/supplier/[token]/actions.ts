"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupplierPayload } from "@/components/supplier/SupplierRequestForm";
import { supplierErrorCode as code, toRpcPayload } from "@/lib/supplier-rpc";

export type SupplierResult = { errorCode?: string; success?: boolean };

const TOKEN = /^[a-f0-9]{64}$/;

export async function submitSupplierResponseAction(token: string, input: SupplierPayload): Promise<SupplierResult> {
  if (!TOKEN.test(token) || !input || !Array.isArray(input.lines)) return { errorCode: "errSupplierLink" };
  if (input.expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn)) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supplier_submit_response", {
    p_token: token,
    p_payload: toRpcPayload(input),
  });
  return error ? { errorCode: code(error.message) } : { success: true };
}

export async function askSupplierQuestionAction(token: string, body: string): Promise<SupplierResult> {
  if (!TOKEN.test(token)) return { errorCode: "errSupplierLink" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supplier_ask_question", { p_token: token, p_body: String(body ?? "").slice(0, 2000) });
  return error ? { errorCode: code(error.message) } : { success: true };
}
