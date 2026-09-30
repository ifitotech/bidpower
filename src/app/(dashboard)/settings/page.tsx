import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

// The forms start from what is saved: saving never overwrites real data with placeholders.
export default async function SettingsPage() {
  const c = await getActionContext().catch(() => null);
  if (!c) redirect("/dashboard");
  const supabase = await createClient();
  const [company, profile] = await Promise.all([
    supabase.from("companies").select("name,phone,email,address,currency,timezone").eq("id", c.companyId).maybeSingle(),
    supabase.from("profiles").select("full_name,phone").eq("id", c.userId).maybeSingle(),
  ]);
  return <SettingsClient isOwner={c.role === "owner"} company={company.data ?? null} profile={profile.data ?? null} />;
}
