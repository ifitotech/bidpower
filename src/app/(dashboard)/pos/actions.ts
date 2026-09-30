"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { poAllowed } from "@/lib/permissions";
import {
  approvePurchaseOrder, cancelPurchaseOrder, completePurchaseOrder, createPurchaseOrderFromResponse, getPurchaseOrderDocumentUrl,
  markPurchaseOrderReceived, markPurchaseOrderSent, recordPurchaseOrderReceipt, setPurchaseOrderExpectedDelivery, rejectPurchaseOrder, uploadPurchaseOrderDocument,
} from "@/lib/services/purchase-orders";

export type POResult = { errorCode?: string; success?: boolean; id?: string; url?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isReviewer = (role: string) => role === "owner" || role === "manager";

// Database rule names -> translated keys.
function fail(e: unknown): POResult {
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
  const rules: [string, string][] = [
    ["po_locked", "errPoLocked"], ["po_needs_manager", "errPoNeedsManager"], ["po_needs_send_permission", "errPoNeedsSendPermission"],
    ["po_needs_document", "errPoNeedsDocument"], ["po_transition_invalid", "errPoTransition"], ["po_complete_via_function", "errPoTransition"],
    ["invalid_amount", "errPoAmount"], ["no_expense_category", "errPoNoCategory"], ["po_no_priced_lines", "errPoNoPricedLines"], ["po_exists", "errPoExists"],
    ["invalid_qty", "errQtyInvalid"], ["check constraint", "errQtyInvalid"], ["file_type", "errFileType"], ["file_size", "errFileSize"], ["forbidden", "errForbidden"], ["row-level security", "errPoNotAllowed"],
  ];
  const hit = rules.find(([k]) => msg.includes(k));
  return { errorCode: hit ? hit[1] : "errGeneric" };
}

async function ctx() {
  try { return await getActionContext(); } catch { return null; }
}

function refresh(id?: string) {
  revalidatePath("/pos");
  if (id) revalidatePath(`/pos/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
}

export async function createPOFromResponseAction(requestId: string, responseId: string): Promise<POResult> {
  const c = await ctx();
  if (!c || !UUID.test(requestId) || !UUID.test(responseId)) return { errorCode: "errGeneric" };
  if (!c.perms.can_create_po) return { errorCode: "errPoNotAllowed" };
  try {
    const po = await createPurchaseOrderFromResponse(c.companyId, c.userId, { requestId, responseId, withinLimit: (amount) => poAllowed(c.perms, amount) });
    refresh(po.id);
    return { success: true, id: po.id };
  } catch (e) { return fail(e); }
}

async function step(poId: string, allow: (c: NonNullable<Awaited<ReturnType<typeof ctx>>>) => boolean, fn: (companyId: string, userId: string) => Promise<unknown>): Promise<POResult> {
  const c = await ctx();
  if (!c || !UUID.test(poId)) return { errorCode: "errGeneric" };
  if (!allow(c)) return { errorCode: "errForbidden" };
  try { await fn(c.companyId, c.userId); refresh(poId); return { success: true }; } catch (e) { return fail(e); }
}

export const approvePOAction = async (poId: string, note?: string) => step(poId, (c) => isReviewer(c.role), (co, u) => approvePurchaseOrder(co, u, poId, note));
export const rejectPOAction = async (poId: string, note?: string) => step(poId, (c) => isReviewer(c.role), (co, u) => rejectPurchaseOrder(co, u, poId, note));
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const validDay = (d?: string | null) => !d || (DAY.test(d) && !Number.isNaN(Date.parse(d)));
export const sendPOAction = async (poId: string, expectedDelivery?: string | null): Promise<POResult> =>
  validDay(expectedDelivery) ? step(poId, (c) => isReviewer(c.role) || c.perms.can_send_po, (co, u) => markPurchaseOrderSent(co, u, poId, expectedDelivery || null)) : { errorCode: "errDateInvalid" };
export const setPOExpectedDeliveryAction = async (poId: string, date: string | null): Promise<POResult> =>
  validDay(date) ? step(poId, (c) => isReviewer(c.role) || c.perms.can_send_po, (co) => setPurchaseOrderExpectedDelivery(co, poId, date || null)) : { errorCode: "errDateInvalid" };
export const recordPOReceiptAction = async (poId: string, lines: { id: string; received: number }[]): Promise<POResult> =>
  Array.isArray(lines) && lines.length > 0 && lines.length <= 200 && lines.every((l) => UUID.test(l.id) && typeof l.received === "number")
    ? step(poId, () => true, (co) => recordPurchaseOrderReceipt(co, poId, lines))
    : { errorCode: "errQtyInvalid" };
export const receivePOAction = async (poId: string) => step(poId, () => true, (co, u) => markPurchaseOrderReceived(co, u, poId));
export const cancelPOAction = async (poId: string) => step(poId, () => true, (co, u) => cancelPurchaseOrder(co, u, poId));

export async function uploadPODocumentAction(formData: FormData): Promise<POResult> {
  const poId = String(formData.get("poId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { errorCode: "errGeneric" };
  return step(poId, (c) => c.perms.can_upload_documents, (co, u) => uploadPurchaseOrderDocument(co, u, poId, file, String(formData.get("kind") ?? "receipt")));
}

export async function completePOAction(poId: string, finalAmount: number, taxAmount: number | null): Promise<POResult> {
  if (typeof finalAmount !== "number" || !Number.isFinite(finalAmount) || finalAmount < 0) return { errorCode: "errPoAmount" };
  const tax = typeof taxAmount === "number" && Number.isFinite(taxAmount) ? taxAmount : null;
  return step(poId, () => true, () => completePurchaseOrder(poId, finalAmount, tax));
}

export async function getPODocumentUrlAction(documentId: string): Promise<POResult> {
  const c = await ctx();
  if (!c || !UUID.test(documentId)) return { errorCode: "errGeneric" };
  try { return { success: true, url: await getPurchaseOrderDocumentUrl(c.companyId, documentId) }; } catch (e) { return fail(e); }
}
