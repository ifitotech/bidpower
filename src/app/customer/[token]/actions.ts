"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type CustomerResult = { errorCode?: string; success?: boolean };

const TOKEN = /^[a-f0-9]{64}$/;

// Database messages -> translated keys.
function code(message: string): string {
  if (message.includes("invalid_link")) return "errCustomerLink";
  if (message.includes("name_required")) return "errNameRequired";
  if (message.includes("message_required")) return "errMessageRequired";
  if (message.includes("not_open") || message.includes("expired") || message.includes("view_only") || message.includes("unsupported")) return "errNotOpen";
  return "errGeneric";
}

/** Approve / request changes / decline. The IP is read by the app server from the request headers. */
export async function customerRespondAction(token: string, action: "approve" | "request_changes" | "decline", name: string, message: string): Promise<CustomerResult> {
  if (!TOKEN.test(token)) return { errorCode: "errCustomerLink" };
  if (action !== "approve" && action !== "request_changes" && action !== "decline") return { errorCode: "errGeneric" };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const supabase = await createClient();
  const { error } = await supabase.rpc("customer_respond", { p_token: token, p_action: action, p_name: String(name ?? "").slice(0, 120), p_message: String(message ?? "").slice(0, 2000), p_ip: ip });
  return error ? { errorCode: code(error.message) } : { success: true };
}
