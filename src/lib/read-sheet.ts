"use client";

/** Reads a spreadsheet the person picked (.xlsx / .csv / .tsv / .txt) as tab-separated text, in the browser. Throws "xls" or "unreadable". */
export async function readSheetText(f: File): Promise<string> {
  if (/\.xls$/i.test(f.name)) throw new Error("xls");
  if (/\.xlsx$/i.test(f.name)) {
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = await readSheet(f);
      return rows.map((r) => r.map((c) => (c == null ? "" : String(c instanceof Date ? c.toISOString().slice(0, 10) : c)).replace(/[\t\r\n]+/g, " ").trim()).join("\t")).join("\n");
    } catch { throw new Error("unreadable"); }
  }
  return f.text();
}
