import { redirect } from "next/navigation";

// The old "material list" was a screen that saved to the browser only. Material Requests inside a project replace it.
export default function MaterialListPage() {
  redirect("/projects");
}
