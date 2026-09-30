"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { getExpenseReceiptUrl, setExpenseStatus } from "@/lib/services/expenses";

export type ExpenseResult = { errorCode?: string; success?: boolean; url?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(e: unknown): ExpenseResult {
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
  if (msg.includes("expense_needs_manager")) return { errorCode: "errPoNeedsManager" };
  if (msg.includes("expense_not_pending")) return { errorCode: "errNotOpen" };
  if (msg.includes("row-level security") || msg.includes("forbidden")) return { errorCode: "errForbidden" };
  return { errorCode: "errGeneric" };
}

async function ctx() {
  try { return await getActionContext(); } catch { return null; }
}

export async function reviewExpenseAction(id: string, decision: "approved" | "rejected"): Promise<ExpenseResult> {
  const c = await ctx();
  if (!c || !UUID.test(id) || (decision !== "approved" && decision !== "rejected")) return { errorCode: "errGeneric" };
  if (c.role !== "owner" && c.role !== "manager") return { errorCode: "errPoNeedsManager" };
  try { await setExpenseStatus(c.companyId, id, ["pending_review"], decision); revalidatePath("/expenses"); revalidatePath(`/expenses/${id}`); revalidatePath("/dashboard"); return { success: true }; } catch (e) { return fail(e); }
}

export async function cancelExpenseAction(id: string): Promise<ExpenseResult> {
  const c = await ctx();
  if (!c || !UUID.test(id)) return { errorCode: "errGeneric" };
  try { await setExpenseStatus(c.companyId, id, ["pending_review"], "cancelled"); revalidatePath("/expenses"); revalidatePath(`/expenses/${id}`); revalidatePath("/dashboard"); return { success: true }; } catch (e) { return fail(e); }
}

export async function getReceiptUrlAction(documentId: string): Promise<ExpenseResult> {
  const c = await ctx();
  if (!c || !UUID.test(documentId)) return { errorCode: "errGeneric" };
  try { return { success: true, url: await getExpenseReceiptUrl(c.companyId, documentId) }; } catch (e) { return fail(e); }
}
