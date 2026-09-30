"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export function MobileHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between safe-top">
      <div className="min-w-0">
        <h1 className="text-lg font-bold truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
