import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getMemberDetail } from "@/lib/services/employees";
import { getProjects } from "@/lib/services/projects";
import MemberDetailClient from "./MemberDetailClient";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const me = await getCurrentMember();
  if (!me?.company_id || me.role !== "owner") redirect("/dashboard");
  const companyId = me.company_id as string;
  const [member, projects] = await Promise.all([getMemberDetail(companyId, id), getProjects(companyId)]);
  if (!member || member.role === "owner") notFound();
  return <MemberDetailClient member={member} projects={projects.map((p) => ({ id: p.id, name: p.name }))} />;
}
