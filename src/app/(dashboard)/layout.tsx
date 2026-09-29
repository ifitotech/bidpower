import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastContainer } from "@/components/ui/Toast";
import { FloatingCreateButton } from "@/components/layout/FloatingCreateButton";
import { getCurrentMember, getCurrentProfile, getMyPermissions, getSession } from "@/lib/auth";
import { PermissionsProvider } from "@/lib/permissions-context";
import { NO_PERMISSIONS, type Permissions } from "@/lib/permissions";

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
  let permissions: Permissions = NO_PERMISSIONS;
  if (configured) {
    const user = await getSession().catch(() => null);
    if (!user) redirect("/login");
    const [member, profile] = await Promise.all([
      getCurrentMember().catch(() => null),
      getCurrentProfile().catch(() => null),
    ]);
    companyName = (member?.company as { name?: string } | null)?.name ?? "";
    role = (member?.role as string | undefined) ?? "";
    permissions = await getMyPermissions(member).catch(() => NO_PERMISSIONS);
    userName = profile?.fullName || profile?.email || "";
  }

  return (
    <PermissionsProvider role={role} permissions={permissions}>
    <div className="app-shell flex min-h-screen">
      <Sidebar companyName={companyName} userName={userName} role={role} />
      <main className="min-w-0 w-full max-w-full flex-1 md:ml-64 min-h-screen pb-24 md:pb-0 ipad-content">
        {children}
      </main>
      <BottomNav />
      <FloatingCreateButton />
      <ToastContainer />
    </div>
    </PermissionsProvider>
  );
}
