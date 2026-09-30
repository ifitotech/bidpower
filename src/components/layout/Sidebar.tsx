"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileSpreadsheet,
  Briefcase,
  CalendarDays,
  Users,
  FileText,
  UserCog,
  Settings,
  FolderOpen,
  Package,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";
import { Logo } from "@/components/shared/Logo";
import { logoutAction } from "@/app/(auth)/actions";

const roleLabel: Record<string, "owner" | "manager" | "employee"> = { owner: "owner", manager: "manager", employee: "employee" };

export function Sidebar({ companyName = "", userName = "", role = "" }: { companyName?: string; userName?: string; role?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { permissions, isManagerOrAbove } = usePermissions();

  const isEmployee = role === "employee";
  const workNav = [
    { href: "/dashboard", label: t("navHome"), icon: Home },
    { href: "/projects", label: t("navProjects"), icon: Briefcase },
    ...(isEmployee ? [] : [
      { href: "/clients", label: t("navClients"), icon: Users },
      { href: "/quotes", label: t("proposals"), icon: FileText },
    ]),
  ];

  const operationsNav = [
    ...(isManagerOrAbove || permissions.can_create_po ? [{ href: "/pos", label: t("navPurchaseOrders"), icon: ShoppingCart }] : []),
    ...(isManagerOrAbove ? [{ href: "/suppliers", label: t("navSuppliers"), icon: Users }] : []),
    ...(isManagerOrAbove || permissions.can_create_pricing_request ? [{ href: "/pricing", label: t("pricingRequests"), icon: Package }] : []),
    ...(isManagerOrAbove ? [{ href: "/materials/requests", label: t("materialRequests"), icon: Package }] : []),
    ...(permissions.can_manage_library ? [{ href: "/materials", label: t("materialsLibrary"), icon: Package }] : []),
    { href: "/calendar", label: t("calendar"), icon: CalendarDays },
    { href: "/files", label: "Files & Photos", icon: FolderOpen },
  ];

  const managementNav = [
    ...(role === "owner" || (role === "manager" && permissions.can_view_costs) ? [{ href: "/accounting", label: t("accounting"), icon: FileSpreadsheet }] : []),
    ...(role === "owner" ? [{ href: "/employees", label: t("navEmployees"), icon: UserCog }] : []),
    ...(isEmployee ? [] : [{ href: "/my-company", label: t("myCompany"), icon: Settings }]),
    { href: "/more", label: "More", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-30">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Logo variant="mark" className="h-10 w-10 shrink-0" />
          <div>
            <p className="font-bold text-lg leading-tight">{t("appName")}</p>
            <p className="max-w-[9.5rem] truncate text-xs text-slate-500">{companyName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavSection label="Work" items={workNav} pathname={pathname} />
        <NavSection label="Operations" items={operationsNav} pathname={pathname} />
        {/* Keep management routes visible without removing any existing module. */}
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-2">
          {t("managementSection")}
        </p>
        {managementNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  active ? "text-brand-600" : "text-slate-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
            {(userName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName || t("userFallback")}</p>
            <p className="text-xs text-slate-500 truncate">{role && roleLabel[role] ? t(roleLabel[role]) : ""}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" aria-label={t("logout")} title={t("logout")} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, items, pathname }: { label: string; items: { href: string; label: string; icon: typeof Home; badge?: number }[]; pathname: string }) {
  return <>
    <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-5 first:mt-0">{label}</p>
    {items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(item.href + "/");
      return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-700 hover:bg-slate-50")}><item.icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-slate-400")} />{item.label}{item.badge ? <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">{item.badge}</span> : null}</Link>;
    })}
  </>;
}
