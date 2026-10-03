"use client";

/** Styled replacement for window.confirm: resolves true when the person confirms, false on cancel / Escape / tapping outside. */
export function confirmAsk(message: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent("bp:confirm", { detail: { message, resolve } }));
  });
}
