import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildQuoteHTML, type QuotePDFData } from "@/lib/pdf/quote-template";
import { getDictionary, locales, defaultLocale, type Locale } from "@/lib/i18n";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      client:clients(*),
      items:quote_items(*),
      company:companies(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = quote as any;

  const pdfData: QuotePDFData = {
    number: q.number,
    issueDate: q.issue_date,
    validUntil: q.valid_until ?? undefined,
    status: q.status,
    company: {
      name: q.company?.name ?? "",
      address: q.company?.address ?? undefined,
      phone: q.company?.phone ?? undefined,
      email: q.company?.email ?? undefined,
    },
    client: {
      name: q.client?.name ?? "",
      contactName: q.client?.contact_name ?? undefined,
      email: q.client?.email ?? undefined,
      phone: q.client?.phone ?? undefined,
      address: q.client?.address ?? undefined,
    },
    items: (q.items ?? []).map(
      (item: {
        description: string;
        quantity: number;
        unit_price: number;
        amount: number;
      }) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        amount: Number(item.amount),
      })
    ),
    subtotal: Number(q.subtotal),
    taxAmount: Number(q.tax_amount),
    discountAmount: Number(q.discount_amount),
    total: Number(q.total),
    terms: q.terms ?? undefined,
    notes: q.notes ?? undefined,
  };

  const lang = request.nextUrl.searchParams.get("lang") as Locale;
  const locale = locales.includes(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const html = buildQuoteHTML(pdfData, (key) => dict[key], locale);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${String(q.number).replace(/[^A-Za-z0-9._-]/g, "_")}.html"`, "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
    },
  });
}
