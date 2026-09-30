import { getCurrentMember, getMyPermissions, requireAuth } from "@/lib/auth";
import type { Permissions } from "@/lib/permissions";

/** Who is calling a server action: user, company, role and effective permissions. Throws if there is no company. */
export async function getActionContext(): Promise<{ userId: string; companyId: string; role: string; perms: Permissions }> {
  const user = await requireAuth();
  const member = await getCurrentMember();
  if (!member?.company_id) throw new Error("no_company");
  const perms = await getMyPermissions(member);
  return { userId: user.id, companyId: member.company_id as string, role: (member.role as string) ?? "", perms };
}
