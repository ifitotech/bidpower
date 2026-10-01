import { getCurrentMember } from "@/lib/auth";
import { getInvoices } from "@/lib/services/invoices";
import { readProjectFilter } from "@/lib/project-filter";
import { ProjectFilter } from "@/components/shared/ProjectFilter";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams;
  try {
    const member = await getCurrentMember();
    if (!member?.company_id) throw new Error("no_company");
    const companyId = member.company_id as string;
    const project = await readProjectFilter(companyId, projectId);
    return <>
      {project && <ProjectFilter name={project.name} clearHref="/invoices" />}
      <InvoicesClient invoices={await getInvoices(companyId, project?.id)} />
    </>;
  } catch {
    return <InvoicesClient invoices={[]} error />;
  }
}
