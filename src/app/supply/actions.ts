"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { getCurrentMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SupplierPayload } from "@/components/supplier/SupplierRequestForm";
import { supplierErrorCode as code, toRpcPayload } from "@/lib/supplier-rpc";

export type SupplyResult = { errorCode?: string; success?: boolean; code?: string; url?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in person's supply company (only Owner/Manager of a supply account). */
async function supplyCompany() {
  const member = await getCurrentMember().catch(() => null);
  const company = member?.company as { id?: string; kind?: string } | null;
  const role = member?.role as string | undefined;
  if (!member?.company_id || company?.kind !== "supply" || (role !== "owner" && role !== "manager")) return null;
  return member.company_id as string;
}

export async function supplyRespondAction(invitationId: string, input: SupplierPayload): Promise<SupplyResult> {
  if (!UUID.test(invitationId) || !input || !Array.isArray(input.lines)) return { errorCode: "errGeneric" };
  if (input.expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn)) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supply_submit_response", { p_invitation: invitationId, p_payload: toRpcPayload(input) });
  if (error) return { errorCode: code(error.message) };
  revalidatePath("/supply");
  return { success: true };
}

export async function supplyAskAction(invitationId: string, body: string): Promise<SupplyResult> {
  if (!UUID.test(invitationId)) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("supply_ask_question", { p_invitation: invitationId, p_body: String(body ?? "").slice(0, 2000) });
  if (error) return { errorCode: code(error.message) };
  revalidatePath("/supply");
  return { success: true };
}

/** Plans/specs the contractor attached: the storage policy (supply_can_read_file) decides, using the person's own session. */
export async function supplyFileUrlAction(path: string): Promise<SupplyResult> {
  if (typeof path !== "string" || path.length > 400 || path.includes("..")) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const signed = await supabase.storage.from("documents").createSignedUrl(path, 120);
  if (signed.error || !signed.data?.signedUrl) return { errorCode: "errForbidden" };
  return { success: true, url: signed.data.signedUrl };
}

export async function createConnectCodeAction(label: string): Promise<SupplyResult> {
  const companyId = await supplyCompany();
  if (!companyId) return { errorCode: "errForbidden" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_supply_connect_code", { p_company: companyId, p_label: String(label ?? "").slice(0, 80) || null });
  if (error) return { errorCode: code(error.message) };
  return { success: true, code: data as string };
}

export async function revokeConnectionAction(connectionId: string): Promise<SupplyResult> {
  if (!UUID.test(connectionId)) return { errorCode: "errGeneric" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_supply_connection", { p_connection: connectionId });
  if (error) return { errorCode: code(error.message) };
  revalidatePath("/supply"); revalidatePath("/supply/contractors"); revalidatePath("/suppliers");
  return { success: true };
}

// Contractor side: enter the code the supply shared.
export async function redeemSupplyCodeAction(code_: string, supplierId?: string | null): Promise<SupplyResult> {
  const c = await getActionContext().catch(() => null);
  if (!c || (c.role !== "owner" && c.role !== "manager")) return { errorCode: "errForbidden" };
  const clean = String(code_ ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{24}$/.test(clean) || (supplierId && !UUID.test(supplierId))) return { errorCode: "errCodeInvalid" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_supply_code", { p_company: c.companyId, p_code: clean, p_supplier_id: supplierId || null });
  if (error) return { errorCode: code(error.message) };
  revalidatePath("/suppliers"); revalidatePath("/pricing");
  return { success: true };
}
