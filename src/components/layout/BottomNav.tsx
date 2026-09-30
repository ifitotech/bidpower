"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Menu, Briefcase, ShoppingCart, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { usePermissions } from "@/lib/permissions-context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const { role, permissions, isManagerOrAbove } = usePermissions();
  const isEmployee = role === "employee";
  const buyHref = isManagerOrAbove || permissions.can_create_pricing_request ? "/pricing" : "/pos";
  const items = [
    { href: "/dashboard", label: t("navHome"), icon: Home },
    { href: "/projects", label: t("navProjects"), icon: Briefcase },
    ...(isEmployee
      ? [
          ...(permissions.can_request_material ? [{ href: "/material", label: t("navMaterial"), icon: ShoppingCart }] : []),
          { href: "/expenses", label: t("navExpenses"), icon: Receipt },
        ]
      : [
          { href: "/quotes", label: t("areaSales"), icon: FileText },
          { href: buyHref, label: t("areaPurchasing"), icon: ShoppingCart },
        ]),
    { href: "/more", label: t("navMore"), icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 w-full max-w-full overflow-x-clip bg-white border-t border-slate-200 z-40 safe-bottom">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-3",
                active ? "text-brand-600" : "text-slate-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span
                className={cn("text-[10px] mt-0.5", active && "font-medium")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
