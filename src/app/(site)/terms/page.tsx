import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "BidPower · Terms" };
export default function TermsPage() { return <LegalPage doc="terms" />; }
