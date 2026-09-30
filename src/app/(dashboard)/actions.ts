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

/** Server actions never return raw messages (they would arrive in one language, often English from the database);
 *  the client translates the code. */
function errCodeOf(err: unknown): string {
  const m = err instanceof Error ? err.message : "";
  if (m.includes("NEXT_REDIRECT")) throw err;
  if (m === "no_company" || m.includes("Unauthorized")) return "errNoCompany";
  return "errGeneric";
}

async function getContext() {
  const user = await requireAuth();
  const member = await getCurrentMember();
  if (!member?.company_id) {
    throw new Error("no_company");
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
      if (logo.size > 5 * 1024 * 1024) return { errorCode: "errLogoSize" };
      if (!logo.type.startsWith("image/")) return { errorCode: "errLogoType" };
      const extension = logo.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${companyId}/company-logo-${Date.now()}.${extension}`;
      const upload = await client.storage.from("documents").upload(path, logo, { upsert: true, contentType: logo.type });
      if (upload.error) return { errorCode: "errGeneric" };
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
    if (error) return { errorCode: "errGeneric" };
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { errorCode: errCodeOf(err) };
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
    if (error) return { errorCode: "errGeneric" };
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return { errorCode: errCodeOf(err) };
  }
}

// ---- Expense categories (Owner only; RLS enforces it again) ----
export async function addExpenseCategoryAction(formData: FormData) {
  try {
    const member = await requireRole(["owner"]);
    const name = String(formData.get("name") || "").trim();
    if (!name || name.length > 60) return { errorCode: "errNameRequired" };
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const { error } = await supabase.from("expense_categories").insert({ company_id: member.company_id as string, name, is_system: false, is_active: true, sort_order: 100 });
    if (error) return { errorCode: "errGeneric" };
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function setExpenseCategoryActiveAction(formData: FormData) {
  try {
    const member = await requireRole(["owner"]);
    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const { error } = await supabase.from("expense_categories").update({ is_active: formData.get("active") === "true" }).eq("id", String(formData.get("id") || "")).eq("company_id", member.company_id as string);
    if (error) return { errorCode: "errGeneric" };
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
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
    if (!name?.trim()) return { errorCode: "errNameRequired" };

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
    return { errorCode: errCodeOf(err) };
  }
}

export async function updateClientAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    const id = String(formData.get("id") || "");
    if (!id) return { errorCode: "errGeneric" };
    await updateClientRecord(id, companyId, { name: String(formData.get("name") || "").trim(), contact_name: String(formData.get("contactName") || "").trim(), email: String(formData.get("email") || "").trim(), phone: String(formData.get("phone") || "").trim(), address: String(formData.get("address") || "").trim(), notes: String(formData.get("notes") || "").trim() });
    revalidatePath("/clients");
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function archiveClientAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await archiveClient(String(formData.get("id") || ""), companyId);
    revalidatePath("/clients");
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

const PROJECT_STATUSES = ["lead", "quoted", "approved", "active", "on_hold", "completed", "cancelled"] as const;

// Returns `errorCode` values that the client translates through i18n.
export async function createProjectAction(formData: FormData) {
  let newProjectId = "";
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
    newProjectId = project.id as string;
  } catch (err) {
    return { errorCode: errCodeOf(err) };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  // The new project is the anchor of everything else: land on it.
  redirect(`/projects/${newProjectId}`);
}

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

export async function updateInvoiceStatusAction(formData: FormData) {
  try { const { companyId } = await getContext(); const id = String(formData.get("invoiceId") || ""); await updateInvoiceStatus(id, companyId, String(formData.get("status") || "draft")); revalidatePath("/invoices"); revalidatePath(`/invoices/${id}`); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function clockInAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); await clockIn(companyId, userId, String(formData.get("projectId") || "") || undefined); revalidatePath("/employees"); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function clockOutAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); await clockOut(companyId, userId, String(formData.get("entryId") || "")); revalidatePath("/employees"); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function uploadDocumentAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); const file = formData.get("file"); if (!(file instanceof File) || file.size === 0) return { errorCode: "errFileRequired" }; const doc = await uploadDocument({ companyId, userId, file, relatedType: String(formData.get("relatedType") || "company") as "project" | "quote" | "purchase_order" | "expense" | "client" | "company", relatedId: String(formData.get("relatedId") || companyId) }); revalidatePath("/files"); return { success: true, id: doc.id, name: doc.name };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function markNotificationReadAction(formData: FormData) { try { const user = await requireAuth(); await markAsRead(String(formData.get("notificationId") || ""), user.id); revalidatePath("/notifications"); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; } }
export async function markAllNotificationsReadAction() { try { const { userId, companyId } = await getContext(); await markAllAsRead(userId, companyId); revalidatePath("/notifications"); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; } }

export async function updateQuoteStatusAction(formData: FormData) {
  try { const { userId, companyId } = await getContext(); const quoteId = String(formData.get("quoteId") || ""); const status = String(formData.get("status") || "draft"); await updateQuoteStatus(quoteId, companyId, userId, status); revalidatePath("/quotes"); revalidatePath(`/quotes/${quoteId}`); return { success: true }; } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function updateProjectAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await updateProject(String(formData.get("id") || ""), companyId, { name: String(formData.get("name") || "").trim(), description: String(formData.get("description") || "").trim(), address: String(formData.get("address") || "").trim(), status: String(formData.get("status") || "lead"), contract_value: Number(formData.get("contractValue") || 0) });
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${String(formData.get("id") || "")}`);
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function archiveProjectAction(formData: FormData) {
  try {
    const { companyId } = await getContext();
    await archiveProject(String(formData.get("id") || ""), companyId);
    revalidatePath("/projects");
    return { success: true };
  } catch (err) { return { errorCode: errCodeOf(err) }; }
}

export async function createExpenseAction(formData: FormData): Promise<{ errorCode?: string; error?: string } | undefined> {
  try {
    const { userId, companyId, role } = await getContext();
    const perms = await getMyPermissions();
    // "Upload receipt" is a permission, not a role: nobody records costs without it (RLS enforces the same rule).
    if (!perms.can_upload_documents && role !== "owner") return { errorCode: "errForbidden" };
    const plan = await getCompanyPlan(companyId);
    const monthlyCount = await getUsage(companyId, "expenses_per_month");

    const categoryId = String(formData.get("categoryId") || "");
    const amount = Number(String(formData.get("amount") || "0").replace(",", "."));
    const projectId = String(formData.get("projectId") || "");
    if (!categoryId) return { errorCode: "errExpenseCategory" };
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return { errorCode: "errExpenseAmount" };

    const expense = await createExpense(companyId, userId, plan, monthlyCount, {
      project_id: projectId || undefined,
      vendor_name: String(formData.get("vendorName") || "").trim().slice(0, 160) || undefined,
      category_id: categoryId,
      amount,
      notes: String(formData.get("notes") || "").trim().slice(0, 1000) || undefined,
      date: String(formData.get("date") || "") || undefined,
      status: role === "owner" || role === "manager" ? "approved" : "pending_review",
    });

    const receipt = formData.get("receipt");
    let receiptFailed = false;
    if (receipt instanceof File && receipt.size > 0) {
      const { attachExpenseReceipt } = await import("@/lib/services/expenses");
      try { await attachExpenseReceipt(companyId, userId, expense.id, receipt); } catch { receiptFailed = true; }
    }

    await logActivity({ companyId, userId, action: "create", entityType: "expense", entityId: expense.id, newValues: { amount } });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    if (projectId) revalidatePath(`/projects/${projectId}`);
    redirect(`/expenses/${expense.id}${receiptFailed ? "?receipt=failed" : ""}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Error al crear gasto";
    if (message.includes("NEXT_REDIRECT")) throw err;
    if (message.includes("row-level security")) return { errorCode: "errForbidden" };
    if (message.includes("límite")) return { errorCode: "errPlanLimit" };
    return { errorCode: "errGeneric" };
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

    // Permission and PO limit (also enforced by RLS). Over the limit the PO is still created,
    // but it waits for Owner/Manager approval instead of being blocked.
    const perms = await getMyPermissions();
    const amount = formData.get("estimatedAmount") ? Number(formData.get("estimatedAmount")) : null;
    if (!perms.can_create_po) return { errorCode: "errPoNotAllowed" };
    const withinLimit = poAllowed(perms, amount);

    const po = await createPurchaseOrder(companyId, userId, {
      project_id: projectId,
      vendor_name: vendorName.trim(),
      category: (formData.get("category") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      estimated_amount: Number(formData.get("estimatedAmount") || 0) || undefined,
    }, withinLimit);

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
    redirect(`/pos/${po.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as { message?: string })?.message || "Error al crear PO";
    if (message.includes("NEXT_REDIRECT")) throw err;
    if (message.includes("row-level security")) return { errorCode: "errPoNotAllowed" };
    return { errorCode: "errGeneric" };
  }
}

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
