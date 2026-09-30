import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getClients } from "@/lib/services/clients";
import { getProjects } from "@/lib/services/projects";
import NewQuoteForm from "./NewQuoteForm";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Proposals are Owner/Manager work. Clients and projects come from the company, never from sample data.
export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ projectId?: string; type?: string }> }) {
  const { projectId } = await searchParams;
  const c = await getActionContext().catch(() => null);
  if (!c || !(c.role === "owner" || c.role === "manager")) redirect("/dashboard");
  const [clients, projects] = await Promise.all([getClients(c.companyId).catch(() => []), getProjects(c.companyId).catch(() => [])]);
  const list = projects.map((p) => ({ id: p.id, name: p.name, client_id: (p as { client_id?: string | null }).client_id ?? null }));
  const chosen = projectId && UUID.test(projectId) ? list.find((p) => p.id === projectId) : undefined;
  return <NewQuoteForm clients={(clients ?? []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }))} projects={list} defaultProjectId={chosen?.id ?? ""} defaultClientId={chosen?.client_id ?? ""} />;
}
