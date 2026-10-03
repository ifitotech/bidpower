"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** A thin bar at the top while a link is loading, so a tap always shows something happening. */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname + url.search === window.location.pathname + window.location.search) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(true), 150); // quick pages never flash the bar
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); clearTimeout(timer.current); };
  }, []);

  useEffect(() => { clearTimeout(timer.current); setActive(false); }, [pathname, search]);

  if (!active) return null;
  return <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 overflow-hidden bg-brand-100"><div className="h-full w-1/3 [animation:navbar_1s_ease-in-out_infinite] bg-brand-600" /></div>;
}
