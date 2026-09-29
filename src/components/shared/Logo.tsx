/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Single place for the BidPower brand.
 *  - mark:   rounded app-icon tile. Works on any background (sidebar, headers).
 *  - symbol: the bare symbol. `tone` is the background it sits on.
 *  - full:   stacked symbol + wordmark. `tone` is the background it sits on.
 * Never use the full logo as a small icon: use mark/symbol below ~120px wide.
 */
type Props = {
  variant?: "mark" | "symbol" | "full";
  /** "dark" = for dark backgrounds (white text), "light" = for light backgrounds. */
  tone?: "dark" | "light";
  className?: string;
};

const SRC = {
  // The small tile has a larger symbol so it stays readable at 24-48 px.
  mark: { dark: "/brand/bidpower-icon-small.svg", light: "/brand/bidpower-icon-small.svg" },
  symbol: { dark: "/brand/bidpower-symbol.svg", light: "/brand/bidpower-symbol-light.svg" },
  full: { dark: "/brand/bidpower-logo-dark.svg", light: "/brand/bidpower-logo-light.svg" },
} as const;

export function Logo({ variant = "mark", tone = "dark", className }: Props) {
  return <img src={SRC[variant][tone]} alt="BidPower" draggable={false} className={cn("select-none", className)} />;
}
