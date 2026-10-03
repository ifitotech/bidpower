import { notFound } from "next/navigation";
import { catalogCount, isPlatformAdmin } from "@/lib/services/catalog";
import CatalogAdminClient from "./CatalogAdminClient";

export const dynamic = "force-dynamic";

// Only platform administrators (a row in platform_admins) can open this; everybody else gets a normal "not found".
export default async function CatalogAdminPage() {
  if (!(await isPlatformAdmin())) notFound();
  return <CatalogAdminClient count={await catalogCount()} />;
}
