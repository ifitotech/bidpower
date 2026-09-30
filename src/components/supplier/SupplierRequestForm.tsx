"use client";

import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/utils";
import { AVAILABILITY, PRICING_TYPES, cleanLinks } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n/dictionaries/es";

export type SupplierData = {
  company: string; supplier_name: string | null; open: boolean;
  request: { number: string; type: string; title: string | null; bid_date: string | null; notes: string | null; links: unknown; delivery_method: string | null; delivery_address: string | null };
  items: { id: string; description: string; quantity: number; unit: string; manufacturer: string | null; catalog_number: string | null; notes: string | null; allow_substitution: boolean }[];
  questions: { author: string; body: string; created_at: string }[];
  files?: { id: string; name: string; mime_type: string; path: string }[];
  response: { quote_number: string | null; total_amount: number | null; freight: number | null; tax_amount: number | null; expires_on: string | null; notes: string | null; status: string; lines: { request_item_id: string; unit_price: number | null; availability: string | null; lead_time: string | null }[] } | null;
};

export type SupplierPayload = {
  contactName?: string; quoteNumber?: string; totalAmount?: number | null; freight?: number | null; taxAmount?: number | null;
  expiresOn?: string | null; notes?: string;
  lines: { requestItemId: string; unitPrice?: number | null; availability?: string | null; leadTime?: string | null; notes?: string | null }[];
};
export type SupplierCallResult = { errorCode?: string; success?: boolean };

const AVAIL_KEYS: Record<string, keyof Dictionary> = { available: "availAvailable", partial: "availPartial", unavailable: "availUnavailable" };
const input = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-base outline-none focus:border-brand-500";
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

/** The supplier's screen: same for the secure link and for a Supply account (only the callbacks differ). */
export function SupplierRequestForm({ data, onSubmit, onAsk, onOpenFile }: {
  data: SupplierData;
  onSubmit: (payload: SupplierPayload) => Promise<SupplierCallResult>;
  onAsk: (body: string) => Promise<SupplierCallResult>;
  onOpenFile?: (path: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const prev = data.response;
  const [contact, setContact] = useState("");
  const [quote, setQuote] = useState(prev?.quote_number ?? "");
  const [total, setTotal] = useState(str(prev?.total_amount));
  const [freight, setFreight] = useState(str(prev?.freight));
  const [tax, setTax] = useState(str(prev?.tax_amount));
  const [expires, setExpires] = useState(prev?.expires_on ?? "");
  const [notes, setNotes] = useState(prev?.notes ?? "");
  const [lines, setLines] = useState<Record<string, { price: string; availability: string; lead: string }>>(() => Object.fromEntries((prev?.lines ?? []).map((l) => [l.request_item_id, { price: str(l.unit_price), availability: l.availability ?? "", lead: l.lead_time ?? "" }])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(data.questions);
  const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
  const setLine = (id: string, p: Partial<{ price: string; availability: string; lead: string }>) => setLines((prevL) => ({ ...prevL, [id]: { ...{ price: "", availability: "", lead: "" }, ...prevL[id], ...p } }));
  const typeKey = PRICING_TYPES.find((p) => p.code === data.request.type)?.key;
  const links = cleanLinks(data.request.links);

  async function submit() {
    setBusy(true); setMsg(null);
    const res = await onSubmit({
      contactName: contact, quoteNumber: quote, totalAmount: num(total), freight: num(freight), taxAmount: num(tax), expiresOn: expires || null, notes,
      lines: data.items.map((i) => ({ requestItemId: i.id, unitPrice: num(lines[i.id]?.price ?? ""), availability: lines[i.id]?.availability || null, leadTime: lines[i.id]?.lead || null })),
    }).catch(() => ({ errorCode: "errGeneric" } as SupplierCallResult));
    setBusy(false);
    setMsg(res.errorCode ? { ok: false, text: t(res.errorCode as keyof Dictionary) } : { ok: true, text: t("supplierSubmitted") });
  }

  async function ask() {
    if (!question.trim()) return;
    setBusy(true); setMsg(null);
    const res = await onAsk(question).catch(() => ({ errorCode: "errGeneric" } as SupplierCallResult));
    setBusy(false);
    if (res.errorCode) { setMsg({ ok: false, text: t(res.errorCode as keyof Dictionary) }); return; }
    setAsked((a) => [...a, { author: "supplier", body: question.trim(), created_at: new Date().toISOString() }]);
    setQuestion("");
    setMsg({ ok: true, text: t("supplierAsked") });
  }

  return <>
    <h1 className="text-xl font-bold">{t("supplierPageTitle", { company: data.company })}</h1>
    <p className="mt-1 text-sm text-slate-500">{data.request.number}{data.request.title ? ` · ${data.request.title}` : ""} · {typeKey ? t(typeKey) : data.request.type}{data.request.bid_date ? ` · ${t("bidDate")} ${formatDate(data.request.bid_date)}` : ""}</p>
    <p className="mt-1 text-sm text-slate-500">{t("supplierPageIntro")}</p>
    {data.request.notes && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm">{data.request.notes}</p>}
    {(data.request.delivery_method || data.request.delivery_address) && <p className="mt-2 text-sm text-slate-600">{t("prDelivery")}: {[data.request.delivery_method === "pickup" ? t("prDeliveryPickup") : data.request.delivery_method === "delivery" ? t("prDeliveryDelivery") : null, data.request.delivery_address].filter(Boolean).join(" · ")}</p>}
    {links.length > 0 && <section className="mt-4"><h2 className="mb-1 text-sm font-semibold">{t("supplierLinksShort")}</h2><ul className="space-y-1.5">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-brand-700"><ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">{l.label}</span></a></li>)}</ul></section>}

    {(data.files ?? []).length > 0 && onOpenFile && <section className="mt-4"><h2 className="mb-1 text-sm font-semibold">{t("prFiles")}</h2><ul className="space-y-1.5">{(data.files ?? []).map((f) => <li key={f.id}><button type="button" onClick={() => onOpenFile(f.path)} className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm"><FileText className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1 truncate">{f.name}</span><span className="text-xs text-slate-400">{t("openFile")}</span></button></li>)}</ul></section>}

    {!data.open && <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t("supplierClosed")}</div>}

    <section className="mt-5 space-y-3">
      {data.items.map((i) => <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-sm font-medium">{i.description} <span className="text-slate-400">· {i.quantity} {i.unit}</span></p>
        <p className="text-xs text-slate-400">{[i.manufacturer, i.catalog_number, i.allow_substitution ? t("substitutionOk") : null, i.notes].filter(Boolean).join(" · ")}</p>
        {data.open && <div className="mt-2 grid grid-cols-3 gap-2">
          <input inputMode="decimal" placeholder={t("unitPrice")} aria-label={`${t("unitPrice")} ${i.description}`} value={lines[i.id]?.price ?? ""} onChange={(e) => setLine(i.id, { price: e.target.value })} className={input} />
          <select aria-label={`${t("availability")} ${i.description}`} value={lines[i.id]?.availability ?? ""} onChange={(e) => setLine(i.id, { availability: e.target.value })} className={input}><option value="">{t("availability")}</option>{AVAILABILITY.map((a) => <option key={a} value={a}>{t(AVAIL_KEYS[a])}</option>)}</select>
          <input placeholder={t("leadTime")} aria-label={`${t("leadTime")} ${i.description}`} value={lines[i.id]?.lead ?? ""} onChange={(e) => setLine(i.id, { lead: e.target.value })} className={input} />
        </div>}
      </div>)}
    </section>

    {data.open && <section className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">{t("supplierContact")}<input value={contact} maxLength={120} onChange={(e) => setContact(e.target.value)} className={`${input} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("quoteNumber")}<input value={quote} maxLength={60} onChange={(e) => setQuote(e.target.value)} className={`${input} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("validUntil")}<input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={`${input} mt-1`} /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="block text-sm font-medium">{t("freight")}<input inputMode="decimal" value={freight} onChange={(e) => setFreight(e.target.value)} className={`${input} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("taxAmount")}<input inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} className={`${input} mt-1`} /></label>
        <label className="block text-sm font-medium">{t("quoteTotal")}<input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className={`${input} mt-1`} /></label>
      </div>
      <textarea value={notes} rows={2} maxLength={2000} aria-label={t("itemNotes")} placeholder={t("itemNotes")} onChange={(e) => setNotes(e.target.value)} className={input} />
      <button type="button" disabled={busy} onClick={submit} className="min-h-12 w-full rounded-xl bg-brand-600 px-4 font-semibold text-white disabled:opacity-40">{t("supplierSubmit")}</button>
    </section>}

    {msg && <div role={msg.ok ? "status" : "alert"} className={`mt-4 rounded-xl border px-4 py-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>}

    <section className="mt-8">
      <h2 className="mb-2 font-semibold">{t("supplierAskTitle")}</h2>
      {asked.length > 0 && <ul className="mb-3 space-y-2">{asked.map((q, idx) => <li key={idx} className={`rounded-xl p-3 text-sm ${q.author === "supplier" ? "bg-white" : "bg-brand-50"}`}><p className="whitespace-pre-wrap">{q.body}</p></li>)}</ul>}
      {data.open && <div className="space-y-2"><textarea value={question} rows={2} maxLength={2000} aria-label={t("supplierAskTitle")} onChange={(e) => setQuestion(e.target.value)} className={input} /><button type="button" disabled={busy || !question.trim()} onClick={ask} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold disabled:opacity-40">{t("supplierAskSend")}</button></div>}
    </section>
  </>;
}
