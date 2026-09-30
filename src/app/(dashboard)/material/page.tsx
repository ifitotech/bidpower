import Link from "next/link";
import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getProjects } from "@/lib/services/projects";
import MaterialDoor from "./MaterialDoor";

export const dynamic = "force-dynamic";

// One door for everything about material: pick the project, build the list, then decide what to do with it
// (ask for quotes, buy now, or send it to the boss).
export default async function MaterialPage() {
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  if (!c.perms.can_request_material) redirect("/dashboard");
  const projects = await getProjects(c.companyId).catch(() => []);
  const open = projects.filter((p: { status: string }) => !["completed", "cancelled"].includes(p.status));
  if (open.length === 1) redirect(`/projects/${open[0].id}/materials/new`);
  return <MaterialDoor projects={open.map((p: { id: string; name: string; client?: { name?: string } | null }) => ({ id: p.id, name: p.name, client: p.client?.name ?? null }))} canCreateProject={c.role === "owner" || c.role === "manager"} />;
}
