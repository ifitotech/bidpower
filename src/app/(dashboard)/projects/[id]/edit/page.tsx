import { notFound, redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getProjectById } from "@/lib/services/projects";
import EditProjectForm from "./EditProjectForm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const member = await getCurrentMember();
  if (!member?.company_id) notFound();
  if (member.role === "employee") redirect(`/projects/${id}`);
  const project = await getProjectById(id, member.company_id as string);
  if (!project) notFound();
  return <EditProjectForm project={{ id: project.id, name: project.name, address: project.address ?? "", status: project.status, contract_value: Number(project.contract_value), description: project.description ?? "" }} />;
}
