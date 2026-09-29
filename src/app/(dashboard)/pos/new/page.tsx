import { getCurrentMember, getMyPermissions } from "@/lib/auth";
import { getProjects } from "@/lib/services/projects";
import NewPOForm from "./NewPOForm";

export default async function NewPOPage() {
  let projects: { id: string; name: string }[] = [];
  let canCreate = false;
  let poLimit: number | null = null;
  try {
    const member = await getCurrentMember();
    if (member?.company_id) {
      const perms = await getMyPermissions(member);
      canCreate = perms.can_create_po;
      poLimit = perms.po_limit;
      projects = (await getProjects(member.company_id as string)).map((p) => ({ id: p.id, name: p.name }));
    }
  } catch {
    // The form shows the "not allowed" notice when nothing could be loaded.
  }
  return <NewPOForm projects={projects} canCreate={canCreate} poLimit={poLimit} />;
}
