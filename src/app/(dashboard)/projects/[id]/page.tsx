import { notFound } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getProjectById } from "@/lib/services/projects";
import ProjectDetailClient from "./ProjectDetailClient";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <ProjectDetailClient error="errNoSupabase" />;
  }

  let project;
  try {
    const member = await getCurrentMember();
    if (!member?.company_id) throw new Error("no-company");
    // Filtered by company_id here and by RLS in the database.
    project = await getProjectById(id, member.company_id as string);
  } catch {
    return <ProjectDetailClient error="errLoadProject" />;
  }
  if (!project) notFound();
  return <ProjectDetailClient project={project} />;
}
