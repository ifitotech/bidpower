"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInvoice, recordInvoicePayment } from "@/lib/services/invoices";
import { logActivity } from "@/lib/services/activity";
import { errCodeOf, getContext } from "@/lib/action-helpers";

export async function createInvoiceAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    if (!description || amount <= 0) return { errorCode: "errInvoiceRequired" };
    const invoice = await createInvoice(companyId, userId, { number: String(formData.get("number") || `INV-${Date.now()}`), clientId: String(formData.get("clientId") || "") || undefined, dueDate: String(formData.get("dueDate") || "") || undefined, notes: String(formData.get("notes") || "") || undefined, items: [{ description, quantity: 1, unitPrice: amount }] });
    await logActivity({ companyId, userId, action: "create", entityType: "invoice", entityId: invoice.id, newValues: { number: invoice.number } });
    revalidatePath("/invoices");
    redirect("/invoices");
  } catch (err) {
    return { errorCode: errCodeOf(err) };
  }
}

export async function recordInvoicePaymentAction(formData: FormData) {
  try { const { companyId } = await getContext(); await recordInvoicePayment(String(formData.get("invoiceId") || ""), companyId, Number(formData.get("amount") || 0)); revalidatePath("/invoices"); revalidatePath(`/invoices/${String(formData.get("invoiceId") || "")}`); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}
