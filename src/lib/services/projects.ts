import { createClient } from "@/lib/supabase/server";
import { COUNTED_EXPENSE_STATUSES, getProjectFinancials } from "@/lib/finance";

/** Only approved/reimbursed expenses are real cost; drafts, rejected and cancelled ones are ignored. */
const countedTotal = (expenses: { amount: number; status?: string }[] | null | undefined) =>
  (expenses ?? []).filter((e) => !e.status || (COUNTED_EXPENSE_STATUSES as readonly string[]).includes(e.status)).reduce((sum, e) => sum + Number(e.amount), 0);
import type { ProjectStatus } from "@/types/database";
import { getMyPermissions } from "@/lib/auth";
import type { Permissions } from "@/lib/permissions";

type Financial = {
  contract_value: number; budget_total: number; budget_materials: number; budget_labor: number;
  budget_subcontractors: number; budget_other: number; spentTotal: number; profit: number; margin: number;
  overBudget: boolean; expenses?: unknown[] | null;
};

/**
 * People without "view costs" must not receive money fields at all; without "view profit"
 * they must not receive profit/margin. Row visibility itself is enforced by RLS.
 */
function applyVisibility<T extends Financial>(project: T, perms: Permissions): T & { costsHidden: boolean; profitHidden: boolean } {
  const costsHidden = !perms.can_view_costs;
  const profitHidden = costsHidden || !perms.can_view_profit;
  const out = { ...project, costsHidden, profitHidden } as T & { costsHidden: boolean; profitHidden: boolean };
  if (costsHidden) {
    out.contract_value = 0; out.budget_total = 0; out.budget_materials = 0; out.budget_labor = 0;
    out.budget_subcontractors = 0; out.budget_other = 0; out.spentTotal = 0; out.overBudget = false;
    if ("expenses" in out) out.expenses = [];
  }
  if (profitHidden) { out.profit = 0; out.margin = 0; }
  return out;
}

export async function getProjects(companyId: string) {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:clients(id, name, contact_name),
      expenses(amount, status)
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const perms = await getMyPermissions();

  return (projects ?? []).map((p) => {
    const spentTotal = countedTotal(p.expenses);

    const financials = getProjectFinancials({
      contractValue: Number(p.contract_value),
      budgetTotal: Number(p.budget_total),
      budgetMaterials: Number(p.budget_materials),
      budgetLabor: Number(p.budget_labor),
      budgetSubcontractors: Number(p.budget_subcontractors),
      budgetOther: Number(p.budget_other),
      spentTotal,
    });

    return applyVisibility({ ...p, spentTotal, ...financials }, perms);
  });
}

export async function getProjectById(projectId: string, companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:clients(*),
      expenses(*, category:expense_categories(name)),
      members:project_members(user_id, profile:profiles(full_name))
    `
    )
    .eq("id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const spentTotal = countedTotal(data.expenses);

  const financials = getProjectFinancials({
    contractValue: Number(data.contract_value),
    budgetTotal: Number(data.budget_total),
    budgetMaterials: Number(data.budget_materials),
    budgetLabor: Number(data.budget_labor),
    budgetSubcontractors: Number(data.budget_subcontractors),
    budgetOther: Number(data.budget_other),
    spentTotal,
  });

  return applyVisibility({ ...data, spentTotal, ...financials }, await getMyPermissions());
}

export async function createProject(
  companyId: string,
  data: {
    client_id: string;
    name: string;
    description?: string;
    address?: string;
    contract_value: number;
    budget_materials?: number;
    budget_labor?: number;
    budget_subcontractors?: number;
    budget_other?: number;
    start_date?: string;
    status?: ProjectStatus;
  }
) {
  const supabase = await createClient();

  const budgetTotal =
    (data.budget_materials ?? 0) +
    (data.budget_labor ?? 0) +
    (data.budget_subcontractors ?? 0) +
    (data.budget_other ?? 0);

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      company_id: companyId,
      client_id: data.client_id,
      name: data.name,
      description: data.description ?? null,
      address: data.address ?? null,
      status: data.status ?? "lead",
      contract_value: data.contract_value,
      budget_total: budgetTotal,
      budget_materials: data.budget_materials ?? 0,
      budget_labor: data.budget_labor ?? 0,
      budget_subcontractors: data.budget_subcontractors ?? 0,
      budget_other: data.budget_other ?? 0,
      start_date: data.start_date ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return project;
}

export async function updateProject(projectId: string, companyId: string, data: { name?: string; description?: string; address?: string; status?: string; contract_value?: number }) {
  const supabase = await createClient();
  const { data: project, error } = await supabase.from("projects").update({ ...data, updated_at: new Date().toISOString() }).eq("id", projectId).eq("company_id", companyId).select().single();
  if (error) throw error;
  return project;
}

export async function archiveProject(projectId: string, companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", projectId).eq("company_id", companyId);
  if (error) throw error;
}
