// Centralized financial calculations
// Avoid duplicating formulas across components

export interface ProjectFinancials {
  contractValue: number;
  budgetTotal: number;
  budgetMaterials: number;
  budgetLabor: number;
  budgetSubcontractors: number;
  budgetOther: number;
  spentTotal: number;
  spentMaterials?: number;
  spentLabor?: number;
  spentOther?: number;
}

export function calculateAvailable(budget: number, spent: number): number {
  return Math.max(0, budget - spent);
}

export function calculateProfit(
  contractValue: number,
  spentTotal: number
): number {
  return contractValue - spentTotal;
}

export function calculateMargin(
  contractValue: number,
  spentTotal: number
): number {
  if (contractValue <= 0) return 0;
  return ((contractValue - spentTotal) / contractValue) * 100;
}

export function calculateBudgetUsage(budget: number, spent: number): number {
  if (budget <= 0) return 0;
  return Math.min(100, (spent / budget) * 100);
}

export function isOverBudget(budget: number, spent: number): boolean {
  return spent > budget;
}

export function isNearBudget(
  budget: number,
  spent: number,
  threshold = 0.9
): boolean {
  if (budget <= 0) return false;
  return spent / budget >= threshold && spent <= budget;
}

export function getProjectFinancials(project: ProjectFinancials) {
  const available = calculateAvailable(project.budgetTotal, project.spentTotal);
  const profit = calculateProfit(project.contractValue, project.spentTotal);
  const margin = calculateMargin(project.contractValue, project.spentTotal);
  const usage = calculateBudgetUsage(project.budgetTotal, project.spentTotal);
  const overBudget = isOverBudget(project.budgetTotal, project.spentTotal);
  const nearBudget = isNearBudget(project.budgetTotal, project.spentTotal);

  return {
    available,
    profit,
    margin,
    usage,
    overBudget,
    nearBudget,
  };
}

// ---- Project control (Phase 7) ----

/** Expense statuses that count as real cost. Drafts, rejected and cancelled expenses never do. */
export const COUNTED_EXPENSE_STATUSES = ["approved", "reimbursed"] as const;

export interface ControlInput {
  contractValue: number;
  budgetTotal: number;
  actualCost: number;
  committedCost: number;
}

/**
 * Actual = money already spent. Committed = POs approved but not yet completed (they turn into actual when
 * completed, so the two never overlap). Forecast = actual + committed. Estimated profit is the contract value
 * minus that forecast; it is an estimate until every PO is completed.
 */
export function getControlFinancials(i: ControlInput) {
  const forecastCost = i.actualCost + i.committedCost;
  const estimatedProfit = i.contractValue - forecastCost;
  return {
    forecastCost,
    estimatedProfit,
    estimatedMargin: i.contractValue > 0 ? (estimatedProfit / i.contractValue) * 100 : 0,
    budgetRemaining: i.budgetTotal - forecastCost,
    budgetUsage: i.budgetTotal > 0 ? Math.min(100, (forecastCost / i.budgetTotal) * 100) : 0,
    overBudget: i.budgetTotal > 0 && forecastCost > i.budgetTotal,
    nearBudget: i.budgetTotal > 0 && forecastCost <= i.budgetTotal && forecastCost / i.budgetTotal >= 0.9,
  };
}
