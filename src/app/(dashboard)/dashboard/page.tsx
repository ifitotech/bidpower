import { getActionContext } from "@/lib/action-context";
import { getCurrentMember, getCurrentProfile } from "@/lib/auth";
import { getDashboardMetrics, getOnboardingProgress } from "@/lib/services/dashboard";
import { getProjects } from "@/lib/services/projects";
import { getNeedsAttention } from "@/lib/services/project-control";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <DashboardClient error="errNoSupabase" firstName="" companyName="" projects={[]} attention={{ invoices: 0, quotes: 0 }} items={[]} />;
  }

  try {
    const member = await getCurrentMember();
    if (!member?.company_id) throw new Error("no-company");
    const companyId = member.company_id as string;
    const [profile, projects, metrics, items, onboarding] = await Promise.all([
      getCurrentProfile(),
      getProjects(companyId),
      // Attention data is optional context; the project list must still render without it.
      getDashboardMetrics(companyId).catch(() => null),
      getActionContext().then((c) => getNeedsAttention(c)).catch(() => []),
      member.role === "owner" ? getOnboardingProgress(companyId).catch(() => []) : Promise.resolve([]),
    ]);
    const company = member.company as { name?: string } | null;
    const firstName = (profile?.fullName || profile?.email || "").split(/[\s@]/)[0];
    return (
      <DashboardClient
        firstName={firstName}
        companyName={company?.name ?? ""}
        projects={projects.slice(0, 6).map((p) => ({ id: p.id, name: p.name, status: p.status, address: p.address, clientName: p.client?.name ?? null }))}
        totalProjects={projects.length}
        attention={{ invoices: metrics?.pendingInvoices ?? 0, quotes: metrics?.pendingQuotes ?? 0 }}
        items={items}
        onboarding={onboarding}
      />
    );
  } catch {
    return <DashboardClient error="errLoadProjects" firstName="" companyName="" projects={[]} attention={{ invoices: 0, quotes: 0 }} items={[]} />;
  }
}
