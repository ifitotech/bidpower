"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createQuote } from "@/lib/services/quotes";
import { getCompanyPlan, getUsage } from "@/lib/services/usage";
import { logActivity } from "@/lib/services/activity";
import { getContext } from "@/lib/action-helpers";

export async function createQuoteAction(formData: FormData): Promise<{ errorCode?: string; error?: string } | undefined> {
  try {
    const { userId, companyId, role } = await getContext();
    if (role !== "owner" && role !== "manager") return { errorCode: "errForbidden" };
    const plan = await getCompanyPlan(companyId);
    const monthlyQuoteCount = await getUsage(companyId, "quotes_per_month");
    const clientId = String(formData.get("clientId") || "");
    const projectId = String(formData.get("projectId") || "");
    let items: { description: string; quantity: number; unit_price: number; part_number?: string }[] = [];
    try { items = JSON.parse(String(formData.get("items") || "[]")); } catch { return { errorCode: "errProposalLines" }; }
    const taxRate = Number(String(formData.get("taxRate") || "0").replace(",", ".") || 0);

    if (!clientId) return { errorCode: "errClientRequired" };
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => !String(item.description || "").trim() || !(Number(item.quantity) > 0) || !Number.isFinite(Number(item.unit_price)))) {
      return { errorCode: "errProposalLines" };
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) return { errorCode: "errGeneric" };

    const quote = await createQuote(companyId, userId, plan, monthlyQuoteCount, {
      client_id: clientId,
      quote_type: String(formData.get("quoteType") || "complete") as "service" | "materials" | "plan_estimate" | "complete",
      project_id: projectId || undefined,
      items: items.map((i) => ({ ...i, description: String(i.description).trim(), quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
      tax_rate: taxRate,
      terms: (formData.get("terms") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    await logActivity({ companyId, userId, action: "create", entityType: "quote", entityId: quote.id, newValues: { number: quote.number } });

    revalidatePath("/quotes");
    revalidatePath("/dashboard");
    redirect(`/quotes/${quote.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Error al crear quote";
    if (message.includes("NEXT_REDIRECT")) throw err;
    if (message.includes("row-level security")) return { errorCode: "errForbidden" };
    if (message.includes("límite")) return { errorCode: "errPlanLimit" };
    return { errorCode: "errGeneric" };
  }
}
