"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMember, requireAuth } from "@/lib/auth";
import { requireRole } from "@/lib/auth";
import { createClientRecord } from "@/lib/services/clients";
import { updateClientRecord, archiveClient } from "@/lib/services/clients";
import { createProject, updateProject, archiveProject } from "@/lib/services/projects";
import { createExpense } from "@/lib/services/expenses";
import { createPurchaseOrder } from "@/lib/services/purchase-orders";
import { createQuote, updateQuoteStatus } from "@/lib/services/quotes";
import { createInvoice, recordInvoicePayment, updateInvoiceStatus } from "@/lib/services/invoices";
import { clockIn, clockOut } from "@/lib/services/time-entries";
import { uploadDocument } from "@/lib/services/documents";
import { markAsRead, markAllAsRead } from "@/lib/services/notifications";
import { getCompanyPlan, getUsage } from "@/lib/services/usage";
import { logActivity } from "@/lib/services/activity";
import {
  inviteEmployee, updateMemberRole, updateMemberPermissions, setMemberActive, revokeInvitation,
  assignProjectMember, unassignProjectMember,
} from "@/lib/services/employees";
import { INVITE_TEMPLATES, PERMISSION_KEYS, PERMISSION_TEMPLATES, isTemplate, poAllowed, type PermissionTemplate, type Permissions } from "@/lib/permissions";
import { getMyPermissions } from "@/lib/auth";

async function getContext() {
  const user = await requireAuth();
  const member = await getCurrentMember();
  if (!member?.company_id) {
    throw new Error("No perteneces a ninguna empresa");
  }
  return {
    userId: user.id,
    companyId: member.company_id as string,
    role: member.role as string,
  };
}

export async function updateCompanyAction(formData: FormData) {
  try {
    const member = await requireRole(["owner"]);
    const companyId = member.company_id as string;
    const supabase = (await import("@/lib/supabase/server")).createClient;
    const client = await supabase();
    const logo = formData.get("logo");
    let logoUrl: string | undefined;
    if (logo instanceof File && logo.size > 0) {
      if (logo.size > 5 * 1024 * 1024) return { error: "El logo no puede superar 5 MB." };
      if (!logo.type.startsWith("image/")) return { error: "El logo debe ser una imagen." };
      const extension = logo.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${companyId}/company-logo-${Date.now()}.${extension}`;
      const upload = await client.storage.from("documents").upload(path, logo, { upsert: true, contentType: logo.type });
      if (upload.error) return { error: upload.error.message };
      logoUrl = path;
    }
    const { error } = await client.from("companies").update({
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      currency: String(formData.get("currency") || "USD"),
      timezone: String(formData.get("timezone") || "America/New_York"),
      ...(logoUrl ? { logo_url: logoUrl } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", companyId);
    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: "Datos guardados correctamente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudieron guardar los datos." };
  }
}

export async function updateProfileAction(formData: FormData) {
  try {
    const user = await requireAuth();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({
      full_name: String(formData.get("fullName") || "").trim() || null,
      phone: String(formData.get("profilePhone") || "").trim() || null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/settings");
    return { success: "Perfil guardado correctamente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el perfil." };
  }
}

// ---- Team & permissions (Phase 2). Owner only; RLS enforces it again in the database. ----

type TeamResult = { success?: boolean; token?: string; errorCode?: string };

function teamError(err: unknown): TeamResult {
  const raw = err instanceof Error ? err.message : (err as { message?: string })?.message || "";
  if (raw.includes("employee_limit")) return { errorCode: "errEmployeeLimit" };
  if (raw.includes("invalid_email")) return { errorCode: "errInvalidEmail" };
  if (raw.includes("owner_membership_protected") || raw.includes("owner_role_cannot")) return { errorCode: "errOwnerProtected" };
  if (raw.includes("forbidden") || raw.includes("row-level security")) return { errorCode: "errForbidden" };
  return { errorCode: "errGeneric" };
}

export async function inviteEmployeeAction(formData: FormData): Promise<TeamResult> {
  try {
    const member = await requireRole(["owner"]);
    const template = String(formData.get("template") || "employee_basic");
    if (!(INVITE_TEMPLATES as readonly string[]).includes(template)) return { errorCode: "errGeneric" };
    const token = await inviteEmployee(member.company_id as string, {
      email: String(formData.get("email") || "").trim(),
      fullName: String(formData.get("fullName") || "").trim(),
      role: template === "manager" ? "manager" : "employee",
      template: template as PermissionTemplate,
    });
    revalidatePath("/employees");
    return { success: true, token };
  } catch (err) {
    return teamError(err);
  }
}

export async function revokeInvitationAction(formData: FormData): Promise<TeamResult> {
  try {
    const member = await requireRole(["owner"]);
    await revokeInvitation(member.company_id as string, String(formData.get("invitationId") || ""));
    revalidatePath("/employees");
    return { success: true };
  } catch (err) { return teamError(err); }
}

export async function updateMemberRoleAction(formData: FormData): Promise<TeamResult> {
  try {
    const member = await requireRole(["owner"]);
    const user = await requireAuth();
    const role = String(formData.get("role") || "employee") === "manager" ? "manager" : "employee";
    await updateMemberRole(member.company_id as string, String(formData.get("memberId") || ""), role, user.id);
    revalidatePath("/employees");
    return { success: true };
  } catch (err) { return teamError(err); }
}

export async function updateMemberPermissionsAction(formData: FormData): Promise<TeamResult> {
  try {
    await requireRole(["owner"]);
    const user = await requireAuth();
    const memberId = String(formData.get("memberId") || "");
    const perms = { ...PERMISSION_TEMPLATES.employee_basic } as Permissions;
    for (const key of PERMISSION_KEYS) perms[key] = formData.get(key) === "on";
    const limitRaw = String(formData.get("po_limit") || "").trim();
    const limit = limitRaw === "" ? null : Number(limitRaw);
    if (limit !== null && (!Number.isFinite(limit) || limit < 0)) return { errorCode: "errGeneric" };
    perms.po_limit = limit;
    // Permissions that make no sense without creating POs are switched off with it.
    if (!perms.can_create_po) { perms.can_send_po = false; perms.po_limit = null; }
    const template = String(formData.get("template") || "");
    await updateMemberPermissions(memberId, user.id, perms, isTemplate(template) ? template : null);
    revalidatePath("/employees");
    revalidatePath(`/employees/${memberId}`);
    return { success: true };
  } catch (err) { return teamError(err); }
}

export async function setMemberActiveAction(formData: FormData): Promise<TeamResult> {
  try {
    await requireRole(["owner"]);
    const memberId = String(formData.get("memberId") || "");
    await setMemberActive(memberId, formData.get("active") === "true");
    revalidatePath("/employees");
    revalidatePath(`/employees/${memberId}`);
    return { success: true };
  } catch (err) { return teamError(err); }
}

export async function setProjectAssignmentAction(formData: FormData): Promise<TeamResult> {
  try {
    const { companyId, role } = await getContext();
    if (role !== "owner" && role !== "manager") return { errorCode: "errForbidden" };
    const projectId = String(formData.get("projectId") || "");
    const userId = String(formData.get("userId") || "");
    if (formData.get("assigned") === "true") await assignProjectMember(projectId, userId);
    else await unassignProjectMember(projectId, userId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/employees");
    void companyId;
    return { success: true };
  } catch (err) { return teamError(err); }
}

export async function acceptInvitationAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  let failed = false;
  try {
    await requireAuth();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_invitation", { p_token: token });
    if (error) failed = true;
  } catch { failed = true; }
  if (failed) redirect(`/invite/${encodeURIComponent(token)}?error=1`);
  redirect("/dashboard");
}

export async function createClientAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "El nombre es obligatorio" };

    const client = await createClientRecord(companyId, {
      name: name.trim(),
      contact_name: (formData.get("contactName") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    await logActivity({
      companyId,
      userId,
      action: "create",
      entityType: "client",
      entityId: client.id,
      newValues: { name },
    });

    revalidatePath("/clients");
    redirect("/clients");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear cliente";
    // Don't return error on redirect
    if (message.includes("NEXT_REDIRECT")) throw err;
    return { error: message };
  }
}

export async function updateClientAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    const id = String(formData.get("id") || "");
    if (!id) return { error: "Cliente inválido" };
    await updateClientRecord(id, companyId, { name: String(formData.get("name") || "").trim(), contact_name: String(formData.get("contactName") || "").trim(), email: String(formData.get("email") || "").trim(), phone: String(formData.get("phone") || "").trim(), address: String(formData.get("address") || "").trim(), notes: String(formData.get("notes") || "").trim() });
    revalidatePath("/clients");
    return { success: true };
  } catch (err) { return { error: err instanceof Error ? err.message : "Error al actualizar cliente" }; }
}

export async function archiveClientAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await archiveClient(String(formData.get("id") || ""), companyId);
    revalidatePath("/clients");
    return { success: true };
  } catch (err) { return { error: err instanceof Error ? err.message : "Error al archivar cliente" }; }
}

const PROJECT_STATUSES = ["lead", "quoted", "approved", "active", "on_hold", "completed", "cancelled"] as const;

// Returns `errorCode` values that the client translates through i18n.
export async function createProjectAction(formData: FormData) {
  try {
    const { userId, companyId, role } = await getContext();
    if (role !== "owner" && role !== "manager") return { errorCode: "errGeneric" };
    const name = String(formData.get("name") || "").trim();
    let clientId = String(formData.get("clientId") || "");
    const newClientName = String(formData.get("newClientName") || "").trim();
    const money = (key: string) => Math.max(0, Number(formData.get(key) || 0) || 0);
    const status = String(formData.get("status") || "lead");

    if (!name || (!clientId && !newClientName)) return { errorCode: "errProjectRequired" };

    if (!clientId || clientId === "new") {
      const client = await createClientRecord(companyId, { name: newClientName });
      clientId = client.id;
    }

    const project = await createProject(companyId, {
      client_id: clientId,
      name,
      description: String(formData.get("description") || "").trim() || undefined,
      address: String(formData.get("address") || "").trim() || undefined,
      status: (PROJECT_STATUSES as readonly string[]).includes(status) ? (status as (typeof PROJECT_STATUSES)[number]) : "lead",
      contract_value: money("contractValue"),
      budget_materials: money("budgetMaterials"),
      budget_labor: money("budgetLabor"),
      budget_subcontractors: money("budgetSubcontractors"),
      budget_other: money("budgetOther"),
      start_date: String(formData.get("startDate") || "") || undefined,
    });

    await logActivity({
      companyId,
      userId,
      action: "create",
      entityType: "project",
      entityId: project.id,
      newValues: { name },
    }).catch(() => undefined);
  } catch (err) {
    return { error: err instanceof Error ? err.message : (err as { message?: string })?.message || undefined, errorCode: "errGeneric" };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function createInvoiceAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount") || 0);
    if (!description || amount <= 0) return { error: "Description and amount are required." };
    const invoice = await createInvoice(companyId, userId, { number: String(formData.get("number") || `INV-${Date.now()}`), clientId: String(formData.get("clientId") || "") || undefined, dueDate: String(formData.get("dueDate") || "") || undefined, notes: String(formData.get("notes") || "") || undefined, items: [{ description, quantity: 1, unitPrice: amount }] });
    await logActivity({ companyId, userId, action: "create", entityType: "invoice", entityId: invoice.id, newValues: { number: invoice.number } });
    revalidatePath("/invoices");
    redirect("/invoices");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create invoice.";
    if (message.includes("NEXT_REDIRECT")) throw err;
    return { error: message };
  }
}

export async function recordInvoicePaymentAction(formData: FormData) {
  try { const { companyId } = await getContext(); await recordInvoicePayment(String(formData.get("invoiceId") || ""), companyId, Number(formData.get("amount") || 0)); revalidatePath("/invoices"); revalidatePath(`/invoices/${String(formData.get("invoiceId") || "")}`); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not record payment." }; }
}

export async function updateInvoiceStatusAction(formData: FormData) {
  try { const { companyId } = await getContext(); const id = String(formData.get("invoiceId") || ""); await updateInvoiceStatus(id, companyId, String(formData.get("status") || "draft")); revalidatePath("/invoices"); revalidatePath(`/invoices/${id}`); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not update invoice status." }; }
}

export async function clockInAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); await clockIn(companyId, userId, String(formData.get("projectId") || "") || undefined); revalidatePath("/employees"); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not clock in." }; }
}

export async function clockOutAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); await clockOut(companyId, userId, String(formData.get("entryId") || "")); revalidatePath("/employees"); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not clock out." }; }
}

export async function uploadDocumentAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); const file = formData.get("file"); if (!(file instanceof File) || file.size === 0) return { error: "Select a file first." }; const doc = await uploadDocument({ companyId, userId, file, relatedType: String(formData.get("relatedType") || "company") as "project" | "quote" | "purchase_order" | "expense" | "client" | "company", relatedId: String(formData.get("relatedId") || companyId) }); revalidatePath("/files"); return { success: true, id: doc.id, name: doc.name };
  } catch (err) { return { error: err instanceof Error ? err.message : "Could not upload file." }; }
}

export async function markNotificationReadAction(formData: FormData) { try { const user = await requireAuth(); await markAsRead(String(formData.get("notificationId") || ""), user.id); revalidatePath("/notifications"); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not mark notification." }; } }
export async function markAllNotificationsReadAction() { try { const { userId, companyId } = await getContext(); await markAllAsRead(userId, companyId); revalidatePath("/notifications"); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not mark notifications." }; } }

export async function updateQuoteStatusAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); const quoteId = String(formData.get("quoteId") || ""); const status = String(formData.get("status") || "draft"); await updateQuoteStatus(quoteId, companyId, userId, status); revalidatePath("/quotes"); revalidatePath(`/quotes/${quoteId}`); return { success: true }; } catch (err) { return { error: err instanceof Error ? err.message : "Could not update quote." }; }
}

export async function updateProjectAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await updateProject(String(formData.get("id") || ""), companyId, { name: String(formData.get("name") || "").trim(), description: String(formData.get("description") || "").trim(), address: String(formData.get("address") || "").trim(), status: String(formData.get("status") || "lead"), contract_value: Number(formData.get("contractValue") || 0) });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${String(formData.get("id") || "")}`);
    return { success: true };
  } catch (err) { return { error: err instanceof Error ? err.message : "Could not update project." }; }
}

export async function archiveProjectAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await archiveProject(String(formData.get("id") || ""), companyId);
    revalidatePath("/projects");
    return { success: true };
  } catch (err) { return { error: err instanceof Error ? err.message : "Could not archive project." }; }
}

export async function createExpenseAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const plan = await getCompanyPlan(companyId);
    const monthlyCount = await getUsage(companyId, "expenses_per_month");

    const categoryId = formData.get("categoryId") as string;
    const amount = Number(formData.get("amount") || 0);

    if (!categoryId || amount <= 0) {
      return { error: "Categoría y monto son obligatorios" };
    }

    const expense = await createExpense(
      companyId,
      userId,
      plan,
      monthlyCount,
      {
        project_id: (formData.get("projectId") as string) || undefined,
        vendor_name: (formData.get("vendorName") as string) || undefined,
        category_id: categoryId,
        amount,
        notes: (formData.get("notes") as string) || undefined,
        date: (formData.get("date") as string) || undefined,
      }
    );

    await logActivity({
      companyId,
      userId,
      action: "create",
      entityType: "expense",
      entityId: expense.id,
      newValues: { amount },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    redirect("/expenses");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear gasto";
    if (message.includes("NEXT_REDIRECT")) throw err;
    return { error: message };
  }
}

export async function createPOAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const projectId = formData.get("projectId") as string;
    const vendorName = formData.get("vendorName") as string;

    if (!projectId || !vendorName?.trim()) {
      return { errorCode: "errProjectRequired" };
    }

    // Permission and PO limit (also enforced by RLS). Above the limit the owner must create the PO;
    // the approval workflow arrives with Purchasing (Phase 5).
    const perms = await getMyPermissions();
    const amount = formData.get("estimatedAmount") ? Number(formData.get("estimatedAmount")) : null;
    if (!perms.can_create_po) return { errorCode: "errPoNotAllowed" };
    if (!poAllowed(perms, amount)) return { errorCode: "errPoOverLimit" };

    const po = await createPurchaseOrder(companyId, userId, {
      project_id: projectId,
      vendor_name: vendorName.trim(),
      category: (formData.get("category") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      estimated_amount: Number(formData.get("estimatedAmount") || 0) || undefined,
    });

    await logActivity({
      companyId,
      userId,
      action: "create",
      entityType: "purchase_order",
      entityId: po.id,
      newValues: { number: po.number },
    });

    revalidatePath("/pos");
    revalidatePath("/dashboard");
    redirect("/pos");
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Error al crear PO";
    if (message.includes("NEXT_REDIRECT")) throw err;
    if (message.includes("row-level security")) return { errorCode: "errPoNotAllowed" };
    return { errorCode: "errGeneric" };
  }
}

export async function createQuoteAction(formData: FormData) {
  try {
    const { userId, companyId } = await getContext();
    const plan = await getCompanyPlan(companyId);
    const monthlyQuoteCount = await getUsage(companyId, "quotes_per_month");
    const clientId = formData.get("clientId") as string;
    const rawItems = formData.get("items") as string;
    const items = JSON.parse(rawItems || "[]") as {
      description: string;
      quantity: number;
      unit_price: number;
      part_number?: string;
    }[];

    if (!clientId || items.length === 0 || items.some((item) => !item.description.trim())) {
      return { error: "Cliente y partidas son obligatorios" };
    }

    const quote = await createQuote(companyId, userId, plan, monthlyQuoteCount, {
      client_id: clientId,
      quote_type: String(formData.get("quoteType") || "complete") as "service" | "materials" | "plan_estimate" | "complete",
      project_id: (formData.get("projectId") as string) || undefined,
      items,
      terms: (formData.get("terms") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    await logActivity({
      companyId,
      userId,
      action: "create",
      entityType: "quote",
      entityId: quote.id,
      newValues: { number: quote.number },
    });

    revalidatePath("/quotes");
    revalidatePath("/dashboard");
    redirect("/quotes");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear quote";
    if (message.includes("NEXT_REDIRECT")) throw err;
    return { error: message };
  }
}
