"use client";

import { useEffect, useRef, useState } from "react";
import { searchCatalogAction } from "@/app/(dashboard)/materials/actions";
import type { CatalogItem } from "./types";

const cache = new Map<string, CatalogItem[]>();

/** Searches the shared catalog on the server as the person types (nothing is shown until they type at least two letters). */
export function useCatalogSearch(text: string): { items: CatalogItem[]; loading: boolean } {
  const q = text.trim().toLowerCase();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (q.length < 2) { setItems([]); setLoading(false); return; }
    const hit = cache.get(q);
    if (hit) { setItems(hit); setLoading(false); return; }
    const mine = ++seq.current;
    setLoading(true);
    const timer = setTimeout(() => {
      searchCatalogAction(q).then((r) => {
        if (mine !== seq.current) return; // a newer search is already running
        if (cache.size > 80) cache.clear();
        cache.set(q, r.items);
        setItems(r.items);
        setLoading(false);
      }).catch(() => { if (mine === seq.current) { setItems([]); setLoading(false); } });
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  return { items, loading };
}
