import { createClient } from "@/lib/supabase/server";
import { canCreate } from "@/lib/plans";

export async function createExpense(
  companyId: string,
  userId: string,
  plan: "free" | "pro" | "ultra",
  monthlyExpenseCount: number,
  data: {
    project_id?: string;
    purchase_order_id?: string;
    vendor_name?: string;
    category_id: string;
    amount: number;
    tax_amount?: number;
    date?: string;
    notes?: string;
    document_id?: string;
    /** Owner/Manager expenses enter approved; everyone else's enter pending_review (the database enforces it). */
    status?: "approved" | "pending_review";
  }
) {
  // Check plan limits
  const limitCheck = canCreate(plan, "expenses_per_month", monthlyExpenseCount);
  if (!limitCheck.allowed) {
    throw new Error(
      "Has alcanzado el límite mensual de gastos del plan Free. Actualiza a Pro."
    );
  }

  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      company_id: companyId,
      project_id: data.project_id ?? null,
      purchase_order_id: data.purchase_order_id ?? null,
      created_by: userId,
      vendor_name: data.vendor_name ?? null,
      category_id: data.category_id,
      amount: data.amount,
      tax_amount: data.tax_amount ?? 0,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      notes: data.notes ?? null,
      document_id: data.document_id ?? null,
      status: data.status ?? "pending_review",
    })
    .select()
    .single();

  if (error) throw error;
  return expense;
}

export async function getExpenses(
  companyId: string,
  filters?: {
    projectId?: string;
    categoryId?: string;
    fromDate?: string;
    toDate?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      category:expense_categories(id, name),
      project:projects(id, name),
      creator:profiles!expenses_created_by_fkey(full_name)
    `
    )
    .eq("company_id", companyId)
    .order("date", { ascending: false });

  if (filters?.projectId) query = query.eq("project_id", filters.projectId);
  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.fromDate) query = query.gte("date", filters.fromDate);
  if (filters?.toDate) query = query.lte("date", filters.toDate);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExpenseCategories(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export async function getExpenseById(id: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, vendor_name, amount, tax_amount, date, notes, status, created_by, created_at, purchase_order_id, document_id, category:expense_categories(id, name), project:projects(id, name), creator:profiles!expenses_created_by_fkey(full_name)")
    .eq("id", id).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const raw = data as unknown as Record<string, unknown>;
  const { data: docs } = await supabase.from("documents").select("id, name").eq("related_type", "expense").eq("related_id", id).order("created_at");
  return {
    ...(raw as { id: string; vendor_name: string | null; amount: number; tax_amount: number | null; date: string; notes: string | null; status: string; created_by: string; created_at: string; purchase_order_id: string | null }),
    amount: Number(raw.amount),
    category: one(raw.category as { id: string; name: string } | { id: string; name: string }[] | null),
    project: one(raw.project as { id: string; name: string } | { id: string; name: string }[] | null),
    creator: one(raw.creator as { full_name: string | null } | { full_name: string | null }[] | null),
    documents: (docs ?? []) as { id: string; name: string }[],
  };
}

export async function setExpenseStatus(companyId: string, id: string, from: string[], to: "approved" | "rejected" | "cancelled" | "reimbursed") {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").update({ status: to, updated_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId).in("status", from).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("expense_not_pending");
}

const RECEIPT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** Receipt photo/PDF stored privately and linked to the expense. */
export async function attachExpenseReceipt(companyId: string, userId: string, expenseId: string, file: File) {
  if (!RECEIPT_TYPES.includes(file.type)) throw new Error("file_type");
  if (file.size > 10 * 1024 * 1024) throw new Error("file_size");
  const supabase = await createClient();
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  const path = `${companyId}/expense/${expenseId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const { data, error } = await supabase.from("documents").insert({
    company_id: companyId, uploaded_by: userId, name: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size, storage_path: path, related_type: "expense", related_id: expenseId,
  }).select("id").single();
  if (error) { await supabase.storage.from("documents").remove([path]); throw error; }
  await supabase.from("expenses").update({ document_id: data.id }).eq("id", expenseId).eq("company_id", companyId);
}

export async function getExpenseReceiptUrl(companyId: string, documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("storage_path").eq("id", documentId).eq("company_id", companyId).eq("related_type", "expense").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("forbidden");
  const signed = await supabase.storage.from("documents").createSignedUrl(data.storage_path as string, 120);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl;
}
