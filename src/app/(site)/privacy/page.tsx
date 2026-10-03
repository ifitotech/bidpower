import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "BidPower · Privacy" };
export default function PrivacyPage() { return <LegalPage doc="privacy" />; }
