"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";

type Pending = { message: string; resolve: (ok: boolean) => void };

/** Mounted once in the root layout; shows the confirmation dialog that `confirmAsk` asks for. */
export function ConfirmHost() {
  const { t } = useI18n();
  const [queue, setQueue] = useState<Pending[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  useEffect(() => {
    const on = (e: Event) => setQueue((q) => [...q, (e as CustomEvent<Pending>).detail]);
    window.addEventListener("bp:confirm", on);
    return () => window.removeEventListener("bp:confirm", on);
  }, []);

  const answer = (ok: boolean) => { current?.resolve(ok); setQueue((q) => q.slice(1)); };

  useEffect(() => {
    if (!current) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") answer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:items-center" onPointerDown={(e) => { if (e.target === e.currentTarget) answer(false); }}>
      <div role="alertdialog" aria-modal="true" aria-label={current.message} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-[15px] leading-relaxed text-slate-800">{current.message}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => answer(false)} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700">{t("cancel")}</button>
          <button ref={okRef} type="button" data-confirm="yes" onClick={() => answer(true)} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white">{t("confirm")}</button>
        </div>
      </div>
    </div>
  );
}
