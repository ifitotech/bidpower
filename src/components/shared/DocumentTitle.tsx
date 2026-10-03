"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n";

// Browser tab / app switcher / history show where you are, in your language.
const TITLES: [RegExp, keyof Dictionary][] = [
  [/^\/dashboard/, "navHome"], [/^\/projects/, "navProjects"], [/^\/clients/, "navClients"], [/^\/quotes/, "proposals"],
  [/^\/invoices/, "navInvoices"], [/^\/expenses/, "navExpenses"], [/^\/pos/, "navPurchaseOrders"], [/^\/pricing/, "navPricing"],
  [/^\/materials/, "materialsLibrary"], [/^\/material/, "navMaterial"], [/^\/reports/, "navReports"], [/^\/accounting/, "accounting"],
  [/^\/employees/, "navTeam"], [/^\/suppliers/, "navSuppliers"], [/^\/calendar/, "calendar"], [/^\/settings/, "settings"],
  [/^\/search/, "navHome"], [/^\/feedback/, "navHelp"], [/^\/more/, "navMore"], [/^\/supply/, "supplyInbox"],
];

export function DocumentTitle() {
  const pathname = usePathname();
  const { t } = useI18n();
  useEffect(() => {
    const hit = TITLES.find(([re]) => re.test(pathname));
    document.title = hit ? `${t(hit[1])} · BidPower` : "BidPower";
  }, [pathname, t]);
  return null;
}
