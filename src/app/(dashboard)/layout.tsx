import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastContainer } from "@/components/ui/Toast";
import { FloatingCreateButton } from "@/components/layout/FloatingCreateButton";
import { getCurrentMember, getCurrentProfile, getSession } from "@/lib/auth";

// Session- and company-specific: never prerender.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The middleware already redirects anonymous users; this keeps every page
  // under (dashboard) safe even if the middleware is bypassed or misconfigured.
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  let companyName = "";
  let userName = "";
  let role = "";
  if (configured) {
    const user = await getSession().catch(() => null);
    if (!user) redirect("/login");
    const [member, profile] = await Promise.all([
      getCurrentMember().catch(() => null),
      getCurrentProfile().catch(() => null),
    ]);
    companyName = (member?.company as { name?: string } | null)?.name ?? "";
    role = (member?.role as string | undefined) ?? "";
    userName = profile?.fullName || profile?.email || "";
  }

  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar companyName={companyName} userName={userName} role={role} />
      <main className="min-w-0 w-full max-w-full flex-1 md:ml-64 min-h-screen pb-24 md:pb-0 ipad-content">
        {children}
      </main>
      <BottomNav />
      <FloatingCreateButton />
      <ToastContainer />
    </div>
  );
}
