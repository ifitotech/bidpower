// Accounting hand-off: dataset definitions and CSV building. BidPower is not accounting software; it exports
// operational records so the accounting system (e.g. QuickBooks) can import them. Pure functions, no I/O.

export const ACCOUNTING_DATASETS = ["customers", "vendors", "projects", "expenses", "purchase_orders", "invoices", "project_costs"] as const;
export type AccountingDataset = (typeof ACCOUNTING_DATASETS)[number];
export type ExportDataset = AccountingDataset | "all";
export type ExportFormat = "csv" | "json";

export type Cell = string | number | boolean | null | undefined;
export type Row = Record<string, Cell>;

/** Column keys are stable, snake_case ids so an import mapping keeps working across releases. */
export const DATASET_COLUMNS: Record<AccountingDataset, string[]> = {
  customers: ["id", "name", "contact_name", "email", "phone", "address", "notes", "is_active", "created_at"],
  vendors: ["id", "name", "email", "phone", "address", "notes", "is_active", "created_at"],
  projects: ["id", "number", "name", "customer_id", "customer_name", "status", "address", "start_date", "estimated_end_date", "contract_value", "budget_total", "created_at"],
  expenses: ["id", "date", "vendor_name", "category", "project_id", "project_number", "project_name", "purchase_order_id", "amount", "tax_amount", "total", "status", "notes"],
  purchase_orders: ["id", "number", "status", "vendor_name", "supplier_id", "project_id", "project_number", "project_name", "category", "description", "estimated_amount", "freight", "tax_amount", "final_amount", "approved_at", "sent_at", "received_at", "completed_at", "created_at"],
  invoices: ["id", "number", "status", "customer_id", "customer_name", "project_id", "project_number", "issue_date", "due_date", "subtotal", "tax", "total", "amount_paid", "created_at"],
  project_costs: ["project_id", "project_number", "project_name", "status", "contract_value", "budget_total", "actual_cost", "committed_cost", "forecast_cost", "pending_approval_cost", "open_po_count"],
};

export function isDataset(v: string | null | undefined): v is ExportDataset {
  return v === "all" || (ACCOUNTING_DATASETS as readonly string[]).includes(v ?? "");
}

/** Text that a spreadsheet would run as a formula gets a leading apostrophe. Numbers are never touched. */
function guard(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function csvCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : typeof v === "boolean" ? (v ? "true" : "false") : guard(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC 4180: CRLF line ends. The UTF-8 BOM makes Excel read accents correctly. */
export function buildCsv(columns: string[], rows: Row[]): string {
  const lines = [columns.join(",")];
  for (const r of rows) lines.push(columns.map((c) => csvCell(r[c])).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function exportFilename(dataset: ExportDataset, format: ExportFormat, today = new Date()): string {
  return `bidpower-${dataset.replace("_", "-")}-${today.toISOString().slice(0, 10)}.${format}`;
}
