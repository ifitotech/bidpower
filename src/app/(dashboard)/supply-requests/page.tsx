import { redirect } from "next/navigation";

// The demo screen that lived here used sample data. Pricing Requests (Phase 4) replace it.
export default function SupplyRequestsPage() {
  redirect("/pricing");
}
