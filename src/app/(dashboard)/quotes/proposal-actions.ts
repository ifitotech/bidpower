"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { updateQuoteStatus } from "@/lib/services/quotes";
import {
  cancelChangeOrder, createChangeOrder, createCustomerLink, declineChangeRequest, newProposalVersion, revokeCustomerLink, type ChangeOrderInput,
} from "@/lib/services/proposals";

export type ProposalResult = { errorCode?: string; success?: boolean; id?: string; token?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(e: unknown): ProposalResult {
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
  const rules: [string, string][] = [
    ["quote_locked", "errQuoteLocked"], ["quote_not_versionable", "errNotVersionable"], ["quote_transition_invalid", "errNotOpen"], ["not_open", "errNotOpen"],
    ["co_lines_required", "errCoLinesRequired"], ["forbidden", "errForbidden"], ["row-level security", "errForbidden"],
  ];
  const hit = rules.find(([k]) => msg.includes(k));
  return { errorCode: hit ? hit[1] : "errGeneric" };
}

// Proposals and Change Orders are Owner/Manager work (RLS enforces the same rule).
async function manager() {
  try {
    const c = await getActionContext();
    return c.role === "owner" || c.role === "manager" ? c : null;
  } catch { return null; }
}

function refresh(quoteId?: string) {
  revalidatePath("/quotes");
  if (quoteId) revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/dashboard");
}

export async function createCustomerLinkAction(quoteId: string, objectType: "proposal" | "change_order", objectId: string, input: { recipientName: string; recipientEmail?: string | null; days?: number }): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(quoteId) || !UUID.test(objectId) || (objectType !== "proposal" && objectType !== "change_order")) return { errorCode: "errForbidden" };
  try {
    const token = await createCustomerLink(c.companyId, c.userId, { objectType, objectId, ...input });
    refresh(quoteId);
    return { success: true, token };
  } catch (e) { return fail(e); }
}

export async function revokeCustomerLinkAction(quoteId: string, linkId: string): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(linkId)) return { errorCode: "errForbidden" };
  try { await revokeCustomerLink(c.companyId, linkId); refresh(quoteId); return { success: true }; } catch (e) { return fail(e); }
}

export async function newProposalVersionAction(quoteId: string): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(quoteId)) return { errorCode: "errForbidden" };
  try { const id = await newProposalVersion(quoteId); refresh(quoteId); return { success: true, id }; } catch (e) { return fail(e); }
}

export async function manualDecisionAction(quoteId: string, status: "approved" | "rejected"): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(quoteId) || (status !== "approved" && status !== "rejected")) return { errorCode: "errForbidden" };
  try { await updateQuoteStatus(quoteId, c.companyId, c.userId, status, "manual (outside the app)"); refresh(quoteId); return { success: true }; } catch (e) { return fail(e); }
}

export async function createChangeOrderAction(input: ChangeOrderInput): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !input || !UUID.test(input.quoteId) || (input.changeRequestId && !UUID.test(input.changeRequestId)) || !Array.isArray(input.lines)) return { errorCode: "errForbidden" };
  try { const co = await createChangeOrder(c.companyId, c.userId, { ...input, lines: input.lines.slice(0, 100) }); refresh(input.quoteId); return { success: true, id: co.id }; } catch (e) { return fail(e); }
}

export async function cancelChangeOrderAction(quoteId: string, id: string): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(id)) return { errorCode: "errForbidden" };
  try { await cancelChangeOrder(c.companyId, id); refresh(quoteId); return { success: true }; } catch (e) { return fail(e); }
}

export async function declineChangeRequestAction(quoteId: string, id: string): Promise<ProposalResult> {
  const c = await manager();
  if (!c || !UUID.test(id)) return { errorCode: "errForbidden" };
  try { await declineChangeRequest(c.companyId, id); refresh(quoteId); return { success: true }; } catch (e) { return fail(e); }
}
