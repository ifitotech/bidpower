#!/usr/bin/env node
// Language audit: visits the main screens in each language and flags text that belongs to another one.
// Product vocabulary that the ES dictionary keeps in English on purpose (Owner, Manager, Quote, PO...) is not flagged.
const { BASE: B, RUN, launch, page, register, createProject } = require("./lib");
const ES_ONLY = /(^|[^a-z])(el|la|los|las|del|para|con|tus|una|aún|todavía|nuevo|nueva|sin|más|solo|por|desde|hasta|empresa|proyecto|proyectos|cliente|clientes|gastos|facturas|guardar|cancelar|eliminar|agregar|crear|buscar|volver|editar)([^a-z]|$)|[áéíóúñ¿¡]/i;
const EN_ONLY = /(^|[^a-z])(the|and|with|your|you|for|yet|not|this|will|from|are|has|have|please|add|new|save|edit|view|delete|cancel|loading|search|back|create|no results|customer|customers|invoices|invoice|expenses|projects|project|company|settings)([^a-z]|$)/i;
const PT_ES = /[ñ¿¡]|(^|[^a-z])(el|los|las|tus|aún|todavía|nuevo|nueva|proyecto|proyectos|empresa|gastos|facturas|guardar|cancelar|eliminar|agregar|crear|buscar|volver)([^a-z]|$)/i;
const ROUTES = ["/dashboard", "/projects", "/projects/new", "/clients", "/clients/new", "/quotes", "/quotes/new", "/expenses", "/expenses/new", "/pos", "/pos/new", "/invoices", "/invoices/new", "/materials", "/materials/requests", "/pricing", "/pricing/new", "/suppliers", "/calendar", "/reports", "/files", "/notifications", "/settings", "/settings/categories", "/my-company", "/more", "/employees", "/employees/invite", "/accounting"];
(async () => {
  const browser = await launch();
  const bad = new Map();
  const seen = { es: new Map(), en: new Map() };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "es-ES" });
  const p = await ctx.newPage();
  const extra = [];
  if (process.env.AUDIT_EMAIL) {
    // Existing account with data (e.g. the one the e2e flows left behind): crawl the detail screens too.
    await p.goto(B + "/login");
    await p.locator("input[type=email]").fill(process.env.AUDIT_EMAIL);
    await p.locator("input[type=password]").fill("Smoke-test-123");
    await p.locator("button[type=submit]").click();
    await p.waitForURL("**/dashboard", { timeout: 30000 });
    for (const list of ["/projects", "/quotes", "/pos", "/pricing", "/materials/requests", "/expenses", "/clients", "/suppliers", "/employees", "/invoices"]) {
      await p.goto(B + list, { waitUntil: "networkidle" });
      const links = await p.locator("a[href]").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
      const detail = [...new Set(links.filter((h) => h && h.startsWith(list + "/") && /[0-9a-f-]{36}/.test(h)))].slice(0, 2);
      for (const d of detail) { extra.push(d); if (list === "/projects") { extra.push(d + "/edit", d + "/materials", d + "/materials/new"); } if (list === "/clients") extra.push(d + "/edit"); }
    }
  } else {
    await register(p, "Ana Audit", `audit-${RUN}@bidpower-smoke.test`, "Audit Co");
    const projectId = await createProject(p, "Audit Project", "Audit Client");
    extra.push(`/projects/${projectId}`, `/projects/${projectId}/edit`);
  }
  for (const locale of ["es", "en", "pt"]) {
    await p.goto(B + "/dashboard");
    await p.evaluate((l) => localStorage.setItem("bidpower-locale", l), locale);
    for (const r of [...ROUTES, ...extra]) {
      await p.goto(B + r, { waitUntil: "networkidle" }).catch(() => {});
      await p.waitForTimeout(400);
      const txt = await p.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); if (s && !["SCRIPT", "STYLE"].includes(n.parentElement?.tagName)) out.push(s); } document.querySelectorAll("[placeholder],[aria-label],[title]").forEach((e) => ["placeholder", "aria-label", "title"].forEach((a) => { const v = e.getAttribute(a); if (v) out.push(v); })); return out; });
      const re = locale === "en" ? ES_ONLY : locale === "es" ? EN_ONLY : PT_ES;
      if (seen[locale]) for (const s of txt) seen[locale].set(s, (seen[locale].get(s) || new Set()).add(r));
      for (const s of txt) if (re.test(s) && s.length < 200) bad.set(`${locale} ${r}: ${s}`, 1);
    }
  }
  for (const k of bad.keys()) if (!k.startsWith("pt ")) console.log(k);
  console.log("\n--- identical in ES and EN (untranslated or proper nouns) ---");
  for (const [s, routes] of seen.es) if (seen.en.has(s) && /[A-Za-z]{3}/.test(s) && !/Audit|@|^[\d\s$.,%/:·-]+$/.test(s)) console.log(`${s}   [${[...routes].slice(0, 3).join(" ")}]`);
  console.log(`\n${bad.size} suspicious strings`);
  await browser.close();
})();
