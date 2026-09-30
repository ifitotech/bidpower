"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";
import { resetPasswordAction } from "../actions";
import { useI18n } from "@/lib/i18n/provider";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await resetPasswordAction(new FormData(event.currentTarget));
    if (result.errorCode) setError(t(result.errorCode as never));
    if (result.successCode) setMessage(t(result.successCode as never));
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B2A5C] to-[#07152B] text-white">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Logo variant="symbol" tone="dark" className="mx-auto mb-4 h-14" />
          <h1 className="text-2xl font-bold">{t("forgotPasswordTitle")}</h1>
          <p className="text-brand-100 mt-2 text-sm">{t("forgotPasswordHint")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="name@example.com" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40" />
          {error && <div className="bg-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</div>}
          {message && <div className="bg-green-500/20 rounded-xl px-4 py-3 text-sm">{message}</div>}
          <Button type="submit" size="lg" loading={loading} className="w-full bg-white text-brand-800 hover:bg-brand-50">{t("sendLink")}</Button>
        </form>
        <Link href="/login" className="text-center text-brand-200 text-sm mt-8 underline">{t("backToLogin")}</Link>
      </div>
    </div>
  );
}
