"use client";

import Link from "next/link";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/provider";
import { acceptInvitationAction } from "@/app/(dashboard)/actions";
import { logoutAction } from "@/app/(auth)/actions";

type Info = { company: string; email: string; role: string };

export default function InviteView({ state, token, info, failed = false }: { state: "invalid" | "signedOut" | "wrongEmail" | "ready"; token: string; info?: Info; failed?: boolean }) {
  const { t } = useI18n();
  const roleName = info?.role === "manager" ? t("manager") : t("employee");
  const link = "block w-full rounded-xl py-3.5 text-center font-medium";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-brand-800 to-brand-900 text-white">
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10"><LanguageSwitcher /></div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"><HardHat className="h-8 w-8" /></div>
          <h1 className="text-2xl font-bold">{state === "invalid" || !info ? t("appName") : t("inviteTitle", { company: info.company })}</h1>
          {info && state !== "invalid" && <p className="mt-2 text-sm text-brand-100">{t("inviteJoinAs", { role: roleName })}</p>}
        </div>

        {state === "invalid" && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-100">{t("inviteInvalid")}</div>}

        {state === "signedOut" && info && <div className="space-y-3">
          <p className="text-center text-sm text-brand-100">{t("inviteSignInToAccept", { email: info.email })}</p>
          <Link href={`/register?invite=${token}`} className={`${link} bg-slate-900 text-slate-200 hover:bg-slate-800`}>{t("createMyAccount")}</Link>
          <Link href={`/login?invite=${token}`} className={`${link} border border-white/30 text-white`}>{t("signIn")}</Link>
        </div>}

        {state === "wrongEmail" && <div className="space-y-3">
          <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-100">{t("inviteWrongEmail")}</div>
          <form action={logoutAction}><Button type="submit" size="lg" className="w-full bg-slate-900 text-slate-200 hover:bg-slate-800">{t("logout")}</Button></form>
        </div>}

        {state === "ready" && <form action={acceptInvitationAction} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          {failed && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-100">{t("inviteInvalid")}</div>}
          <Button type="submit" size="lg" className="w-full bg-slate-900 text-slate-200 hover:bg-slate-800">{t("acceptInvitation")}</Button>
        </form>}
      </div>
    </div>
  );
}
