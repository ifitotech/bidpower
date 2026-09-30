import type { SupabaseClient } from "@supabase/supabase-js";
import { COUNTED_EXPENSE_STATUSES } from "@/lib/finance";
import type { AccountingDataset, Row } from "@/lib/accounting";

export type ExportFilters = { from?: string | null; to?: string | null; projectId?: string | null };

const PAGE = 1000;
export const MAX_EXPORT_ROWS = 20000;

// Every read goes through the caller's session, so RLS decides what may leave; nothing here uses elevated access.
async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; out.length < MAX_EXPORT_ROWS; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
type Proj = { number?: string | null; name?: string | null } | null;
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export async function loadDataset(supabase: SupabaseClient, companyId: string, dataset: AccountingDataset, f: ExportFilters): Promise<Row[]> {
  switch (dataset) {
    case "customers":
      return (await all<Row>((a, b) => supabase.from("clients").select("id,name,contact_name,email,phone,address,notes,is_active,created_at").eq("company_id", companyId).order("name").range(a, b)));
    case "vendors":
      return (await all<Row>((a, b) => supabase.from("suppliers").select("id,name,email,phone,address,notes,is_active,created_at").eq("company_id", companyId).order("name").range(a, b)));
    case "projects": {
      const rows = await all<Record<string, unknown>>((a, b) => {
        let q = supabase.from("projects").select("id,number,name,client_id,status,address,start_date,estimated_end_date,contract_value,budget_total,created_at,client:clients(name)").eq("company_id", companyId);
        if (f.projectId) q = q.eq("id", f.projectId);
        return q.order("created_at").range(a, b);
      });
      return rows.map((r) => ({ ...r, customer_id: r.client_id, customer_name: one(r.client as { name?: string } | null)?.name ?? null, contract_value: n(r.contract_value), budget_total: n(r.budget_total) }) as Row);
    }
    case "expenses": {
      const rows = await all<Record<string, unknown>>((a, b) => {
        let q = supabase.from("expenses").select("id,date,vendor_name,project_id,purchase_order_id,amount,tax_amount,status,notes,category:expense_categories(name),project:projects(number,name)").eq("company_id", companyId).in("status", [...COUNTED_EXPENSE_STATUSES]);
        if (f.projectId) q = q.eq("project_id", f.projectId);
        if (f.from) q = q.gte("date", f.from);
        if (f.to) q = q.lte("date", f.to);
        return q.order("date").order("id").range(a, b);
      });
      return rows.map((r) => {
        const p = one(r.project as Proj);
        const amount = n(r.amount) ?? 0, tax = n(r.tax_amount) ?? 0;
        return { ...r, category: one(r.category as { name?: string } | null)?.name ?? null, project_number: p?.number ?? null, project_name: p?.name ?? null, amount, tax_amount: tax, total: Math.round((amount + tax) * 100) / 100 } as Row;
      });
    }
    case "purchase_orders": {
      const rows = await all<Record<string, unknown>>((a, b) => {
        let q = supabase.from("purchase_orders").select("id,number,status,vendor_name,supplier_id,project_id,category,description,estimated_amount,freight,tax_amount,final_amount,approved_at,sent_at,received_at,completed_at,created_at,project:projects(number,name)").eq("company_id", companyId);
        if (f.projectId) q = q.eq("project_id", f.projectId);
        if (f.from) q = q.gte("created_at", f.from);
        if (f.to) q = q.lte("created_at", `${f.to}T23:59:59.999Z`);
        return q.order("created_at").order("id").range(a, b);
      });
      return rows.map((r) => {
        const p = one(r.project as Proj);
        return { ...r, project_number: p?.number ?? null, project_name: p?.name ?? null, estimated_amount: n(r.estimated_amount), freight: n(r.freight), tax_amount: n(r.tax_amount), final_amount: n(r.final_amount) } as Row;
      });
    }
    case "invoices": {
      const rows = await all<Record<string, unknown>>((a, b) => {
        let q = supabase.from("invoices").select("id,number,status,client_id,project_id,issue_date,due_date,subtotal,tax,total,amount_paid,created_at,client:clients(name),project:projects(number)").eq("company_id", companyId);
        if (f.projectId) q = q.eq("project_id", f.projectId);
        if (f.from) q = q.gte("issue_date", f.from);
        if (f.to) q = q.lte("issue_date", f.to);
        return q.order("issue_date").order("id").range(a, b);
      });
      return rows.map((r) => ({ ...r, customer_id: r.client_id, customer_name: one(r.client as { name?: string } | null)?.name ?? null, project_number: one(r.project as Proj)?.number ?? null, subtotal: n(r.subtotal), tax: n(r.tax), total: n(r.total), amount_paid: n(r.amount_paid) }) as Row);
    }
    case "project_costs": {
      const rows = await all<Record<string, unknown>>((a, b) => {
        let q = supabase.from("projects").select("id,number,name,status,contract_value,budget_total").eq("company_id", companyId);
        if (f.projectId) q = q.eq("id", f.projectId);
        return q.order("created_at").range(a, b);
      });
      const costs = await all<Record<string, unknown>>((a, b) => supabase.from("project_cost_summary").select("project_id,actual_cost,committed_cost,pending_approval_cost,open_po_count").eq("company_id", companyId).range(a, b));
      const byProject = new Map(costs.map((c) => [c.project_id as string, c]));
      return rows.map((p) => {
        const c = byProject.get(p.id as string);
        const actual = n(c?.actual_cost) ?? 0, committed = n(c?.committed_cost) ?? 0;
        return { project_id: p.id, project_number: p.number, project_name: p.name, status: p.status, contract_value: n(p.contract_value), budget_total: n(p.budget_total), actual_cost: actual, committed_cost: committed, forecast_cost: Math.round((actual + committed) * 100) / 100, pending_approval_cost: n(c?.pending_approval_cost) ?? 0, open_po_count: n(c?.open_po_count) ?? 0 } as Row;
      });
    }
  }
}
