import { redirect } from "next/navigation";
import { getActionContext } from "@/lib/action-context";
import { getMaterials, getSavedLists } from "@/lib/services/materials";
import MaterialsClient from "./MaterialsClient";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const c = await getActionContext().catch(() => null);
  if (!c || !c.perms.can_manage_library) redirect("/dashboard");
  try {
    const [items, lists] = await Promise.all([getMaterials(c.companyId), getSavedLists(c.companyId)]);
    return <MaterialsClient items={items} lists={lists} />;
  } catch {
    return <MaterialsClient items={[]} lists={[]} error />;
  }
}
