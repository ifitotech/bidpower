import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/auth";
import { ACCOUNTING_DATASETS, DATASET_COLUMNS, buildCsv, exportFilename, isDataset, type ExportFormat, type Row } from "@/lib/accounting";
import { loadDataset } from "@/lib/services/accounting";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const member = await getCurrentMember();
  const companyId = member?.company_id as string | undefined;
  if (!companyId) return NextResponse.json({ error: "no_company" }, { status: 403 });

  const { data: allowed } = await supabase.rpc("can_export_accounting", { p_company: companyId });
  if (allowed !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const dataset = sp.get("dataset");
  const format = (sp.get("format") ?? "csv") as ExportFormat;
  const from = sp.get("from") || null, to = sp.get("to") || null, projectId = sp.get("project") || null;
  if (!isDataset(dataset)) return NextResponse.json({ error: "invalid_dataset" }, { status: 400 });
  if (format !== "csv" && format !== "json") return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  if (dataset === "all" && format === "csv") return NextResponse.json({ error: "all_requires_json" }, { status: 400 });
  if ((from && !DATE.test(from)) || (to && !DATE.test(to)) || (from && to && from > to)) return NextResponse.json({ error: "invalid_dates" }, { status: 400 });
  if (projectId && !UUID.test(projectId)) return NextResponse.json({ error: "invalid_project" }, { status: 400 });

  const filters = { from, to, projectId };
  let body: string, rowCount = 0, contentType: string;
  try {
    if (dataset === "all") {
      const out: Record<string, Row[]> = {};
      for (const d of ACCOUNTING_DATASETS) {
        out[d] = (await loadDataset(supabase, companyId, d, filters)).map((r) => Object.fromEntries(DATASET_COLUMNS[d].map((c) => [c, r[c] ?? null])));
        rowCount += out[d].length;
      }
      body = JSON.stringify({ exported_at: new Date().toISOString(), filters: { from, to, project_id: projectId }, datasets: out }, null, 2);
      contentType = "application/json; charset=utf-8";
    } else {
      const rows = await loadDataset(supabase, companyId, dataset, filters);
      rowCount = rows.length;
      if (format === "csv") {
        body = buildCsv(DATASET_COLUMNS[dataset], rows);
        contentType = "text/csv; charset=utf-8";
      } else {
        body = JSON.stringify({ exported_at: new Date().toISOString(), dataset, filters: { from, to, project_id: projectId }, rows: rows.map((r) => Object.fromEntries(DATASET_COLUMNS[dataset].map((c) => [c, r[c] ?? null]))) }, null, 2);
        contentType = "application/json; charset=utf-8";
      }
    }
  } catch {
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }

  // The log is the audit trail; if it cannot be written the file is not handed over.
  const { error: logError } = await supabase.from("accounting_export_log").insert({ company_id: companyId, dataset, format, date_from: from, date_to: to, project_id: projectId, row_count: rowCount, exported_by: user.id });
  if (logError) return NextResponse.json({ error: "log_failed" }, { status: 500 });

  return new NextResponse(body, { headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${exportFilename(dataset, format)}"`, "Cache-Control": "no-store" } });
}
