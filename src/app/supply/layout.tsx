import { redirect } from "next/navigation";
import { getCurrentMember, getCurrentProfile, getSession } from "@/lib/auth";
import SupplyShell from "./SupplyShell";

export const dynamic = "force-dynamic";

// Workspace of a Supply account. Contractors go to their own dashboard; nobody reaches contractor data from here.
export default async function SupplyLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession().catch(() => null);
  if (!user) redirect("/login");
  const [member, profile] = await Promise.all([getCurrentMember().catch(() => null), getCurrentProfile().catch(() => null)]);
  const company = member?.company as { name?: string; kind?: string } | null;
  if (!member || company?.kind !== "supply") redirect("/dashboard");
  return <SupplyShell companyName={company?.name ?? ""} userName={profile?.fullName || profile?.email || ""} role={(member.role as string) ?? ""}>{children}</SupplyShell>;
}
