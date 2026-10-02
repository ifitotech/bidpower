"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInvoice, getQuoteInvoicing, recordInvoicePayment, updateInvoiceStatus } from "@/lib/services/invoices";
import { logActivity } from "@/lib/services/activity";
import { errCodeOf, getContext } from "@/lib/action-helpers";

export async function createInvoiceAction(formData: FormData) {
  try {
    const { userId, companyId, role } = await getContext();
    if (role !== "owner" && role !== "manager") return { errorCode: "errForbidden" };
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    if (!description || !(amount > 0)) return { errorCode: "errInvoiceRequired" };
    const quoteId = String(formData.get("quoteId") || "");
    let clientId = String(formData.get("clientId") || "") || undefined;
    let projectId: string | undefined;
    if (quoteId) {
      // Billing a proposal: client and project come from it, and the proposal's total cannot be exceeded.
      const billing = await getQuoteInvoicing(companyId, quoteId);
      if (!billing || billing.quote.status !== "approved") return { errorCode: "errInvoiceQuoteNotApproved" };
      if (amount > billing.remaining + 0.005) return { errorCode: "errInvoiceTooMuch" };
      clientId = billing.quote.client_id ?? undefined;
      projectId = billing.quote.project_id ?? undefined;
    }
    const invoice = await createInvoice(companyId, userId, {
      number: String(formData.get("number") || `INV-${Date.now()}`), clientId, projectId, quoteId: quoteId || undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined, notes: String(formData.get("notes") || "") || undefined,
      items: [{ description, quantity: 1, unitPrice: amount }],
    });
    await logActivity({ companyId, userId, action: "create", entityType: "invoice", entityId: invoice.id, newValues: { number: invoice.number } });
    revalidatePath("/invoices");
    if (quoteId) revalidatePath(`/quotes/${quoteId}`);
    redirect(quoteId ? `/quotes/${quoteId}` : "/invoices");
  } catch (err) {
    return { errorCode: errCodeOf(err) };
  }
}

export async function recordInvoicePaymentAction(formData: FormData) {
  try { const { companyId } = await getContext(); await recordInvoicePayment(String(formData.get("invoiceId") || ""), companyId, Number(formData.get("amount") || 0)); revalidatePath("/invoices"); revalidatePath(`/invoices/${String(formData.get("invoiceId") || "")}`); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function setInvoiceStatusAction(invoiceId: string, status: string) {
  try {
    const { companyId, role } = await getContext();
    if (role !== "owner" && role !== "manager") return { errorCode: "errForbidden" };
    if (status !== "sent" && status !== "cancelled") return { errorCode: "errGeneric" };
    await updateInvoiceStatus(invoiceId, companyId, status);
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true };
  } catch (err) {
    const m = err instanceof Error ? err.message : "";
    if (m.includes("invoice_transition_invalid")) return { errorCode: "errInvoiceTransition" };
    return { errorCode: errCodeOf(err) };
  }
}
