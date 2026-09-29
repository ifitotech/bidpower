import { createClient } from "@/lib/supabase/server";
import InviteView from "./InviteView";

export const dynamic = "force-dynamic";

const TOKEN = /^[a-f0-9]{64}$/;

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!TOKEN.test(token) || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <InviteView state="invalid" token="" />;
  }

  const supabase = await createClient();
  // Public preview: only company name, invited email/name and role, and only while the invitation is live.
  const { data } = await supabase.rpc("get_invitation_preview", { p_token: token });
  const preview = Array.isArray(data) ? data[0] : data;
  if (!preview) return <InviteView state="invalid" token="" />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const info = { company: preview.company_name as string, email: preview.email as string, role: preview.role as string };
  if (!user) return <InviteView state="signedOut" token={token} info={info} />;
  if ((user.email ?? "").toLowerCase() !== info.email.toLowerCase()) return <InviteView state="wrongEmail" token={token} info={info} />;
  return <InviteView state="ready" token={token} info={info} failed={Boolean(error)} />;
}
