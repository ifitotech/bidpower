"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { registerAction } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";
import { LegalLinks } from "@/components/site/LegalLinks";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function RegisterPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [invite, setInvite] = useState("");
  const [kind, setKind] = useState<"contractor" | "supply">("contractor");

  // Invitation link: the account joins the inviting company (no company step, email is fixed).
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite") ?? "";
    if (!/^[a-f0-9]{64}$/.test(token)) return;
    setInvite(token);
    createClient()
      .rpc("get_invitation_preview", { p_token: token })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.email) setEmail(row.email as string);
        if (row?.full_name) setFullName((current) => current || (row.full_name as string));
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1 && !invite) {
      setStep(2);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    formData.set("fullName", fullName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("companyName", companyName);
    formData.set("phone", phone);
    formData.set("accountKind", kind);
    if (invite) formData.set("invite", invite);
    try {
      const result = await registerAction(formData);
      if (result?.errorCode || result?.error) {
        setError(result.errorCode ? t(result.errorCode as keyof Dictionary) : (result.error as string));
        setLoading(false);
      } else if (result?.successCode) {
        setSuccess(t(result.successCode as keyof Dictionary));
        setLoading(false);
      }
      // On success the server action redirects to /dashboard.
    } catch {
      setError(t("errGeneric"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B2A5C] to-[#07152B] text-white">
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10">
        <LanguageSwitcher />
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full py-12">
        <div className="text-center mb-8">
          <Logo variant="symbol" tone="dark" className="mx-auto mb-4 h-14" />
          <h1 className="text-2xl font-bold">{invite ? t("createMyAccount") : t("register")}</h1>
          {!invite && <p className="text-brand-100 mt-1 text-sm">
            {t("stepOf", { current: step, total: 2 })} ·{" "}
            {step === 1 ? t("yourData") : t("yourCompany")}
          </p>}
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("fullName")}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  readOnly={Boolean(invite)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("password")}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
            </>
          ) : (
            <>
              <div role="radiogroup" aria-label={t("accountType")} className="grid grid-cols-2 gap-2">
                {(["contractor", "supply"] as const).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition ${kind === k ? "border-white bg-white text-slate-900" : "border-white/20 bg-white/10 text-white"}`}>
                    {k === "contractor" ? t("accountContractor") : t("accountSupply")}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("companyName")}</label>
                <input
                  name="companyNameField"
                  type="text"
                  required
                  autoComplete="off"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-form-type="other"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("phone")}</label>
                <input
                  name="phoneField"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-form-type="other"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              {kind === "contractor" && <div>
                <label className="text-xs text-brand-200 mb-1 block">{t("businessType")}</label>
                <select
                  name="businessType"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  <option value="electrical" className="text-slate-900">{t("btElectrical")}</option>
                  <option value="hvac" className="text-slate-900">{t("btHvac")}</option>
                  <option value="plumbing" className="text-slate-900">{t("btPlumbing")}</option>
                  <option value="remodeling" className="text-slate-900">{t("btRemodeling")}</option>
                  <option value="construction" className="text-slate-900">{t("btConstruction")}</option>
                  <option value="general" className="text-slate-900">{t("btGeneral")}</option>
                  <option value="other" className="text-slate-900">{t("btOther")}</option>
                </select>
              </div>}
            </>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-3 text-sm text-green-100">
              {success}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full bg-slate-900 text-slate-200 hover:bg-slate-800 mt-2"
          >
            {invite ? t("createMyAccount") : step === 1 ? t("continue") : t("register")}
          </Button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-brand-200 text-sm py-2"
            >
              ← {t("back")}
            </button>
          )}
        </form>

        <p className="text-center text-brand-200 text-sm mt-8">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-white font-medium underline">
            {t("signIn")}
          </Link>
        </p>
      </div>

      <div className="px-6 pb-8 text-center text-brand-300 text-xs space-y-2">
        <div>{t("freeTrialNote")}</div>
        <LegalLinks tone="dark" accept />
      </div>
    </div>
  );
}
