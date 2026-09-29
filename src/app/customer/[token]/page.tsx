import { createClient } from "@/lib/supabase/server";
import CustomerView, { type CustomerData } from "./CustomerView";

export const dynamic = "force-dynamic";

const TOKEN = /^[a-f0-9]{64}$/;

// Public page for the customer. The token is the only credential; the database function returns only what was shared.
export default async function CustomerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN.test(token) || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return <CustomerView token="" data={null} />;
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_get", { p_token: token });
  return <CustomerView token={token} data={(data as CustomerData | null) ?? null} />;
}
