"use server";

import { createClient } from "@/lib/supabase/server";
import { createCompanyWithOwner } from "@/lib/services/companies";
import { redirect } from "next/navigation";

// Error codes are translated on the client through the i18n dictionaries.
export type AuthResult = { error?: string; errorCode?: string; successCode?: string } | undefined;

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const companyName = String(formData.get("companyName") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || undefined;

  if (!email || !password || !fullName || !companyName) return { errorCode: "errMissingFields" };
  if (password.length < 8) return { errorCode: "errPasswordShort" };
  if (!hasSupabaseEnv()) return { errorCode: "errNoSupabase" };

  const supabase = await createClient();

  // 1. Auth user. Company data travels in the user metadata so the company can
  //    still be created on first login when email confirmation is required.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, company_name: companyName, phone: phone ?? "" },
      ...(process.env.NEXT_PUBLIC_SITE_URL ? { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` } : {}),
    },
  });

  if (authError) {
    if (/already registered|already exists/i.test(authError.message)) return { errorCode: "errEmailExists" };
    return { error: authError.message };
  }
  if (!authData.user) return { errorCode: "errGeneric" };

  // Supabase hides duplicate emails when confirmation is on by returning a user
  // with no identities.
  if (authData.user.identities && authData.user.identities.length === 0) return { errorCode: "errEmailExists" };

  // No session: email confirmation is enabled. The company is created on first login.
  if (!authData.session) return { successCode: "checkEmailToConfirm" };

  // 2. Profile + company + owner membership + settings + Free plan + categories (atomic, RLS-safe).
  try {
    await createCompanyWithOwner({ fullName, companyName, phone });
  } catch {
    // The account exists and is signed in; the company is retried from metadata on the next request.
    return { errorCode: "errCompanyCreate" };
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { errorCode: "errMissingFields" };
  if (!hasSupabaseEnv()) return { errorCode: "errNoSupabase" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (/invalid login credentials/i.test(error.message)) return { errorCode: "errInvalidCredentials" };
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return { error: "No se pudo iniciar sesión con Google." };
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "El email es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: "Revisa tu correo para continuar." };
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
