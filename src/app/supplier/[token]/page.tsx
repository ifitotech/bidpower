import { createClient } from "@/lib/supabase/server";
import SupplierView, { type SupplierData } from "./SupplierView";

export const dynamic = "force-dynamic";

const TOKEN = /^[a-f0-9]{64}$/;

// Public page for Supply. The token is the only credential; the database function returns just this request.
export default async function SupplierPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN.test(token) || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <SupplierView token="" data={null} />;
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("supplier_get_request", { p_token: token });
  return <SupplierView token={token} data={(data as SupplierData | null) ?? null} />;
}
