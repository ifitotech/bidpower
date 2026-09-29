import { getCurrentMember } from "@/lib/auth";
import { getClients } from "@/lib/services/clients";
import NewProjectForm from "./NewProjectForm";

export default async function NewProjectPage() {
  let clients: { id: string; name: string }[] = [];
  try {
    const member = await getCurrentMember();
    if (member?.company_id) {
      const rows = await getClients(member.company_id as string);
      clients = (rows ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));
    }
  } catch {
    // The form still works: the user can type a new client.
  }
  return <NewProjectForm clients={clients} />;
}
