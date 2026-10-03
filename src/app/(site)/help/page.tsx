import type { Metadata } from "next";
import { HelpCenter } from "@/components/site/HelpCenter";

export const metadata: Metadata = { title: "BidPower · Help" };
export default function HelpPage() { return <HelpCenter />; }
