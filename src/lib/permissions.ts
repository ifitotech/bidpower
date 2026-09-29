// Individual permissions (Phase 2). The database is the source of truth: RLS uses
// has_permission() / po_within_limit(). This module mirrors the templates so the UI can
// show and edit them, and hides what a person is not allowed to see.

import type { UserRole } from "@/types/database";

export const PERMISSION_KEYS = [
  "can_request_material",
  "can_upload_documents",
  "can_manage_library",
  "can_create_pricing_request",
  "can_create_po",
  "can_send_po",
  "can_view_costs",
  "can_view_profit",
  "can_create_proposal",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type Permissions = Record<PermissionKey, boolean> & {
  /** null = no limit; 0 = every PO is above the limit */
  po_limit: number | null;
};

export type PermissionTemplate = "owner" | "manager" | "employee_basic" | "employee_purchasing";

// Keep in sync with permission_template() in supabase/migrations/20260731000008_phase2_team_permissions.sql
export const PERMISSION_TEMPLATES: Record<PermissionTemplate, Permissions> = {
  owner: {
    can_request_material: true, can_upload_documents: true, can_manage_library: true,
    can_create_pricing_request: true, can_create_po: true, can_send_po: true, po_limit: null,
    can_view_costs: true, can_view_profit: true, can_create_proposal: true,
  },
  manager: {
    can_request_material: true, can_upload_documents: true, can_manage_library: true,
    can_create_pricing_request: true, can_create_po: true, can_send_po: true, po_limit: null,
    can_view_costs: true, can_view_profit: false, can_create_proposal: true,
  },
  employee_purchasing: {
    can_request_material: true, can_upload_documents: true, can_manage_library: false,
    can_create_pricing_request: false, can_create_po: true, can_send_po: false, po_limit: 500,
    can_view_costs: false, can_view_profit: false, can_create_proposal: false,
  },
  employee_basic: {
    can_request_material: true, can_upload_documents: true, can_manage_library: false,
    can_create_pricing_request: false, can_create_po: false, can_send_po: false, po_limit: null,
    can_view_costs: false, can_view_profit: false, can_create_proposal: false,
  },
};

export const INVITE_TEMPLATES = ["employee_basic", "employee_purchasing", "manager"] as const;

/** Effective permissions for a member row. Owners always have everything. */
export function resolvePermissions(role: UserRole | string | null | undefined, row?: Partial<Permissions> | null): Permissions {
  if (role === "owner") return PERMISSION_TEMPLATES.owner;
  const base = role === "manager" ? PERMISSION_TEMPLATES.manager : PERMISSION_TEMPLATES.employee_basic;
  if (!row) return base;
  const out = { ...base };
  for (const key of PERMISSION_KEYS) if (typeof row[key] === "boolean") out[key] = row[key] as boolean;
  out.po_limit = row.po_limit === undefined || row.po_limit === null ? null : Number(row.po_limit);
  return out;
}

export const NO_PERMISSIONS: Permissions = {
  ...PERMISSION_TEMPLATES.employee_basic,
  can_request_material: false,
  can_upload_documents: false,
};

/** True when this PO amount is allowed for these permissions. Unknown amount never bypasses a limit. */
export function poAllowed(p: Permissions, amount: number | null | undefined): boolean {
  if (!p.can_create_po) return false;
  if (p.po_limit === null) return true;
  if (amount === null || amount === undefined || Number.isNaN(amount)) return false;
  return amount <= p.po_limit;
}

export function isTemplate(value: string): value is PermissionTemplate {
  return value in PERMISSION_TEMPLATES;
}
