// Shown instantly while a page loads, so a tap always gives feedback (and the menu stays in place).
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-4 p-4 md:p-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">…</span>
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />)}
      </div>
      <div className="h-40 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
