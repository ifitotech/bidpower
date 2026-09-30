import { redirect } from "next/navigation";

// The company area is Settings now; old links keep working.
export default function MyCompanyPage() {
  redirect("/settings");
}
