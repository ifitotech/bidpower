// Auth & company helpers
// Central place for session, membership and role checks

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createCompanyWithOwner } from "@/lib/services/companies";
import type { UserRole } from "@/types/database";
import { NO_PERMISSIONS, resolvePermissions, type Permissions } from "@/lib/permissions";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function fetchActiveMember(userId: string) {
  const supabase = await createClient();
  // RLS lets a member see every member of their company, so filter by user explicitly.
  const { data: member } = await supabase
    .from("company_members")
    .select("*, company:companies(*)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return member;
}

/**
 * Active membership (and company) of the signed-in user. RLS already limits the
 * rows to the user's own companies. If the user is authenticated but has no
 * company yet (e.g. email confirmation was required at sign-up, or the first
 * attempt failed), it is created here from the sign-up metadata.
 */
export const getCurrentMember = cache(async function getCurrentMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const member = await fetchActiveMember(user.id);
  if (member) return member;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  // Invited people join the inviting company; they must never get a company of their own by accident.
  const inviteToken = String(meta.invite_token ?? "").trim();
  if (inviteToken) {
    const { error } = await supabase.rpc("accept_invitation", { p_token: inviteToken });
    return error ? null : fetchActiveMember(user.id);
  }

  const fullName = String(meta.full_name ?? meta.name ?? "").trim();
  const companyName =
    String(meta.company_name ?? "").trim() ||
    fullName ||
    (user.email ? user.email.split("@")[0] : "");
  if (!companyName) return null;

  try {
    await createCompanyWithOwner({
      fullName,
      companyName,
      phone: String(meta.phone ?? "").trim() || undefined,
      kind: String(meta.account_kind ?? "") === "supply" ? "supply" : "contractor",
    });
  } catch {
    return null;
  }
  return fetchActiveMember(user.id);
});

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  return { id: user.id, email: user.email ?? data?.email ?? null, fullName: data?.full_name ?? null };
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowed: UserRole[]) {
  const member = await getCurrentMember();
  if (!member || !allowed.includes(member.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return member;
}

export function isOwner(role: string) {
  return role === "owner";
}

export function isManagerOrAbove(role: string) {
  return role === "owner" || role === "manager";
}

export function canViewFinancials(role: string) {
  return role === "owner" || role === "manager";
}

export function canManageEmployees(role: string) {
  return role === "owner";
}

export function canApproveExceptions(role: string) {
  return role === "owner" || role === "manager";
}

/** Effective permissions of the signed-in user in their current company. */
export async function getMyPermissions(member?: { id?: string; role?: string } | null): Promise<Permissions> {
  const current = member ?? (await getCurrentMember());
  if (!current?.id) return NO_PERMISSIONS;
  if (current.role === "owner") return resolvePermissions("owner");
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_permissions")
    .select("*")
    .eq("member_id", current.id)
    .maybeSingle();
  return resolvePermissions(current.role, data as Partial<Permissions> | null);
}
