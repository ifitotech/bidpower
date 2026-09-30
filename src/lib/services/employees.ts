import { createClient } from "@/lib/supabase/server";
import { checkLimit } from "./usage";
import { PERMISSION_KEYS, PERMISSION_TEMPLATES, resolvePermissions, type PermissionTemplate, type Permissions } from "@/lib/permissions";

export async function getEmployees(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_members")
    .select(
      `
      id, role, is_active, joined_at, invited_at,
      profile:profiles(id, full_name, email, avatar_url, phone)
    `
    )
    .eq("company_id", companyId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Creates a secure, single-use invitation and returns the raw token (shown once).
 * The invitee signs up / signs in with the same email and opens /invite/<token>.
 */
export async function inviteEmployee(
  companyId: string,
  data: { email: string; fullName: string; role: "manager" | "employee"; template?: PermissionTemplate }
) {
  const limit = await checkLimit(companyId, "employees");
  if (!limit.allowed) throw new Error("employee_limit");

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("create_member_invitation", {
    p_company: companyId,
    p_email: data.email,
    p_full_name: data.fullName,
    p_role: data.role,
    p_template: data.template ?? null,
  });
  if (error) throw error;
  return token as string;
}

export async function getPendingInvitations(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_invitations")
    .select("id, email, full_name, role, template, expires_at, created_at")
    .eq("company_id", companyId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function revokeInvitation(companyId: string, invitationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("member_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function getMemberDetail(companyId: string, memberId: string) {
  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("company_members")
    .select("id, user_id, role, is_active, joined_at, profile:profiles(full_name, email, phone)")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  if (!member) return null;

  const [{ data: permRow }, { data: assignments }] = await Promise.all([
    supabase.from("member_permissions").select("*").eq("member_id", memberId).maybeSingle(),
    supabase.from("project_members").select("project_id").eq("user_id", member.user_id),
  ]);

  const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
  return {
    id: member.id as string,
    userId: member.user_id as string,
    role: member.role as string,
    isActive: member.is_active as boolean,
    profile: (profile ?? null) as { full_name?: string | null; email?: string | null; phone?: string | null } | null,
    permissions: resolvePermissions(member.role, permRow as Partial<Permissions> | null),
    template: ((permRow as { template?: string | null } | null)?.template ?? null) as string | null,
    assignedProjectIds: (assignments ?? []).map((a) => a.project_id as string),
  };
}

/** Owner only (enforced by RLS): replaces the member's permission row. Every change is audited by a trigger. */
export async function updateMemberPermissions(
  memberId: string,
  updatedBy: string,
  perms: Permissions,
  template: PermissionTemplate | null
) {
  const supabase = await createClient();
  const values: Record<string, unknown> = { po_limit: perms.po_limit, template, updated_by: updatedBy, updated_at: new Date().toISOString() };
  for (const key of PERMISSION_KEYS) values[key] = perms[key];
  const { data, error } = await supabase.from("member_permissions").update(values).eq("member_id", memberId).select("member_id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
}

export async function updateMemberRole(
  companyId: string,
  memberId: string,
  role: "manager" | "employee",
  updatedBy: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_members")
    .update({ role })
    .eq("id", memberId)
    .eq("company_id", companyId)
    .neq("role", "owner") // the owner role never changes
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("forbidden");
  // A new role starts from that role's template; the owner can fine-tune afterwards.
  const template: PermissionTemplate = role === "manager" ? "manager" : "employee_basic";
  await updateMemberPermissions(memberId, updatedBy, PERMISSION_TEMPLATES[template], template);
}

/** Deactivates or reactivates a member. History is kept; deactivation also drops project assignments. */
export async function setMemberActive(memberId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_active", { p_member: memberId, p_active: active });
  if (error) throw error;
}

export async function deactivateMember(_companyId: string, memberId: string) {
  await setMemberActive(memberId, false);
}

export async function assignProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert({ project_id: projectId, user_id: userId }, { onConflict: "project_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function unassignProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").delete().eq("project_id", projectId).eq("user_id", userId);
  if (error) throw error;
}

/** People assigned to a project (owners/managers only, by RLS). */
export async function getProjectTeam(projectId: string, companyId: string) {
  const supabase = await createClient();
  const [{ data: assigned }, { data: members }] = await Promise.all([
    supabase.from("project_members").select("user_id").eq("project_id", projectId),
    supabase
      .from("company_members")
      .select("user_id, role, profile:profiles(full_name, email)")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .neq("role", "owner"),
  ]);
  const assignedIds = new Set((assigned ?? []).map((a) => a.user_id as string));
  const people = (members ?? []).map((m) => {
    const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return { userId: m.user_id as string, role: m.role as string, name: (profile?.full_name || profile?.email || "—") as string, assigned: assignedIds.has(m.user_id as string) };
  });
  return people;
}
