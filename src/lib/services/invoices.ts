import { createClient } from "@/lib/supabase/server";

export async function getInvoices(companyId: string, projectId?: string) {
  const supabase = await createClient();
  let query = supabase.from("invoices").select("*, client:clients(name), project:projects(name)").eq("company_id", companyId).order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createInvoice(companyId: string, userId: string, data: { clientId?: string; projectId?: string; quoteId?: string; number: string; dueDate?: string; notes?: string; items: { description: string; quantity: number; unitPrice: number; partNumber?: string }[] }) {
  const supabase = await createClient();
  const items = data.items.map((item) => ({ ...item, amount: item.quantity * item.unitPrice }));
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const { data: invoice, error } = await supabase.from("invoices").insert({ company_id: companyId, client_id: data.clientId || null, project_id: data.projectId || null, quote_id: data.quoteId || null, number: data.number, due_date: data.dueDate || null, notes: data.notes || null, subtotal, total: subtotal, created_by: userId }).select().single();
  if (error) throw error;
  const { error: itemError } = await supabase.from("invoice_items").insert(items.map((item) => ({ invoice_id: invoice.id, description: item.description, quantity: item.quantity, unit_price: item.unitPrice, amount: item.amount, part_number: item.partNumber || null })));
  if (itemError) throw itemError;
  return invoice;
}

export async function getInvoiceById(invoiceId: string, companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").select("*, client:clients(name,email), project:projects(name), quote:quotes(number), items:invoice_items(*)").eq("id", invoiceId).eq("company_id", companyId).single();
  if (error) throw error;
  return data;
}

export async function recordInvoicePayment(invoiceId: string, companyId: string, amount: number) {
  const supabase = await createClient();
  const { data: invoice, error: readError } = await supabase.from("invoices").select("total, amount_paid").eq("id", invoiceId).eq("company_id", companyId).single();
  if (readError) throw readError;
  const paid = Math.min(Number(invoice.total), Number(invoice.amount_paid) + amount);
  const status = paid >= Number(invoice.total) ? "paid" : paid > 0 ? "partial" : "sent";
  const { error } = await supabase.from("invoices").update({ amount_paid: paid, status, updated_at: new Date().toISOString() }).eq("id", invoiceId).eq("company_id", companyId);
  if (error) throw error;
}

export async function updateInvoiceStatus(invoiceId: string, companyId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status, updated_at: new Date().toISOString() }).eq("id", invoiceId).eq("company_id", companyId);
  if (error) throw error;
}

export type QuoteInvoicing = {
  quote: { id: string; number: string; status: string; total: number; client_id: string | null; project_id: string | null; clientName: string | null; projectName: string | null };
  invoices: { id: string; number: string; status: string; total: number }[];
  invoiced: number;
  remaining: number;
};

/** What has been billed against a proposal so far (cancelled invoices do not count). */
export async function getQuoteInvoicing(companyId: string, quoteId: string): Promise<QuoteInvoicing | null> {
  const supabase = await createClient();
  const { data: q, error } = await supabase.from("quotes").select("id, number, status, total, client_id, project_id, client:clients(name), project:projects(name)").eq("id", quoteId).eq("company_id", companyId).maybeSingle();
  if (error) throw error;
  if (!q) return null;
  const { data: inv, error: invErr } = await supabase.from("invoices").select("id, number, status, total").eq("company_id", companyId).eq("quote_id", quoteId).order("created_at");
  if (invErr) throw invErr;
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as { name?: string } | null;
  const invoices = (inv ?? []).map((i) => ({ id: i.id as string, number: i.number as string, status: i.status as string, total: Number(i.total) }));
  const invoiced = Math.round(invoices.filter((i) => i.status !== "cancelled").reduce((sum, i) => sum + i.total, 0) * 100) / 100;
  const total = Number(q.total);
  return {
    quote: { id: q.id as string, number: q.number as string, status: q.status as string, total, client_id: q.client_id as string | null, project_id: q.project_id as string | null, clientName: one(q.client)?.name ?? null, projectName: one(q.project)?.name ?? null },
    invoices, invoiced, remaining: Math.max(0, Math.round((total - invoiced) * 100) / 100),
  };
}

/** Next free INV-0001 style number for the company. */
export async function nextInvoiceNumber(companyId: string): Promise<string> {
  const supabase = await createClient();
  const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId);
  let n = (count ?? 0) + 1;
  for (let i = 0; i < 20; i++, n++) {
    const candidate = `INV-${String(n).padStart(4, "0")}`;
    const { data } = await supabase.from("invoices").select("id").eq("company_id", companyId).eq("number", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `INV-${Date.now()}`;
}
