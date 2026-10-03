"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "@/components/shared/Logo";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { logoutAction } from "@/app/(auth)/actions";

export default function SupplyShell({ companyName, userName, role, children }: { companyName: string; userName: string; role: string; children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const canUse = role === "owner" || role === "manager";
  const items = [{ href: "/supply", label: t("supplyInbox"), icon: Inbox, exact: true }, { href: "/supply/contractors", label: t("supplyContractors"), icon: Users, exact: false }];
  const active = (href: string, exact: boolean) => (exact ? pathname === href || pathname.startsWith("/supply/requests") : pathname.startsWith(href));
  return <div className="app-shell min-h-screen bg-slate-50">
    <DocumentTitle />
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <Logo variant="mark" className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{companyName}</p><p className="truncate text-xs text-slate-500">{t("supplyAccountLabel")} · {userName}</p></div>
        <LanguageSwitcher />
        <form action={logoutAction}><button type="submit" aria-label={t("logout")} title={t("logout")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-600"><LogOut className="h-4 w-4" /></button></form>
      </div>
      {canUse && <nav className="mx-auto hidden max-w-4xl gap-1 px-4 md:flex">{items.map((i) => <Link key={i.href} href={i.href} className={cn("flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium", active(i.href, i.exact) ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500")}><i.icon className="h-4 w-4" />{i.label}</Link>)}</nav>}
    </header>
    <main className="mx-auto max-w-4xl pb-24 md:pb-8">{canUse ? children : <p className="p-6 text-sm text-slate-500">{t("errForbidden")}</p>}</main>
    {canUse && <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">{items.map((i) => <Link key={i.href} href={i.href} className={cn("flex flex-col items-center px-4 py-1 text-xs", active(i.href, i.exact) ? "text-brand-600" : "text-slate-400")}><i.icon className="h-5 w-5" />{i.label}</Link>)}</nav>}
  </div>;
}
