"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/action-context";
import { createClient } from "@/lib/supabase/server";

export async function sendFeedbackAction(message: string, page?: string | null): Promise<{ success?: boolean; errorCode?: string }> {
  const text = String(message ?? "").trim();
  if (!text || text.length > 2000) return { errorCode: "errFeedbackEmpty" };
  let c;
  try { c = await getActionContext(); } catch { return { errorCode: "errGeneric" }; }
  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({ company_id: c.companyId, user_id: c.userId, page: page ? String(page).slice(0, 200) : null, message: text });
  if (error) return { errorCode: "errGeneric" };
  revalidatePath("/feedback");
  return { success: true };
}
