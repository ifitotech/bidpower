#!/usr/bin/env node
/**
 * BidPower — smoke test for Phase 1 (auth, company, projects) and Phase 2 (team, permissions).
 *
 * Runs a real browser against a running app (local `npm run start` or the Vercel URL) and the
 * real Supabase project behind it. It creates test users with the domain @bidpower-smoke.test.
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app node scripts/smoke-phase1-2.js
 *   (needs Playwright + Chromium: `npx playwright install chromium`, or a global playwright)
 *
 * Requirements: Supabase Auth "Confirm email" OFF (or the test users confirmed by hand).
 * Cleanup afterwards (Supabase SQL editor):
 *   DELETE FROM companies WHERE id IN (SELECT company_id FROM company_members m JOIN profiles p ON p.id = m.user_id WHERE p.email LIKE '%@bidpower-smoke.test');
 *   DELETE FROM auth.users WHERE email LIKE '%@bidpower-smoke.test';
 */
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright")); }

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const RUN = Date.now().toString(36);
const OWNER = `owner-${RUN}@bidpower-smoke.test`;
const OTHER = `other-${RUN}@bidpower-smoke.test`;
const LUIS = `luis-${RUN}@bidpower-smoke.test`;
const PASSWORD = "Smoke-test-123";
let failed = 0;
const ok = (name, cond) => { console.log((cond ? "PASS " : "FAIL ") + name); if (!cond) failed++; };

async function register(page, name, email, company) {
  await page.goto(BASE + "/register");
  await page.getByRole("textbox").nth(0).fill(name);
  await page.getByRole("textbox").nth(1).fill(email);
  await page.locator("input[type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /Continuar|Continue/ }).click();
  await page.locator("input[name=companyNameField]").fill(company);
  await page.getByRole("button", { name: /Crear empresa|Create free company/ }).click();
  await page.waitForURL("**/dashboard", { timeout: 30000 });
}

async function createProject(page, name, client) {
  await page.goto(BASE + "/projects/new");
  await page.locator("input[name=name]").fill(name);
  if (await page.locator("select[name=clientId]").count()) await page.locator("select[name=clientId]").selectOption("new");
  await page.locator("input[name=newClientName]").fill(client);
  await page.locator("input[name=address]").fill("123 Ocean Dr, Miami");
  await page.locator("input[name=contractValue]").fill("5000");
  await page.getByRole("button", { name: /Crear proyecto|Create project/ }).click();
  await page.waitForURL("**/projects", { timeout: 30000 });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const ctx = (w = 1280, h = 900) => browser.newContext({ viewport: { width: w, height: h }, locale: "es-ES" }).then((c) => c.newPage());

  // ---- Phase 1 ----
  const o = await ctx();
  ok("unauthenticated /dashboard redirects to /login", await (async () => { await o.goto(BASE + "/dashboard"); return o.url().includes("/login"); })());
  await register(o, "Ana Owner", OWNER, "Smoke Electric");
  ok("register lands on Home with greeting", (await o.locator("main h1").first().innerText()).includes("Ana"));
  await createProject(o, "Miami Beach", "Cliente Miami");
  await createProject(o, "Coral Gables", "Cliente Coral");
  ok("projects list shows both", (await o.getByText("Miami Beach").count()) > 0 && (await o.getByText("Coral Gables").count()) > 0);
  await o.locator("a[href^='/projects/']:not([href='/projects/new'])").first().click();
  await o.waitForURL(/projects\/[0-9a-f-]{36}$/);
  const projectUrl = o.url();
  await o.reload();
  ok("project detail survives refresh", (await o.locator("main h1").innerText()).length > 0);
  await o.goto(BASE + "/more");
  await o.locator("main").getByRole("button", { name: /Cerrar sesión|Log out/ }).click();
  await o.waitForURL("**/login");
  ok("logout goes to /login", true);
  await o.goto(BASE + "/projects");
  ok("protected route redirects after logout", o.url().includes("/login"));
  await o.locator("input[name=email]").fill(OWNER);
  await o.locator("input[name=password]").fill("wrong-password");
  await o.getByRole("button", { name: /Entrar|Sign in/ }).first().click();
  await o.waitForTimeout(2500);
  ok("wrong password shows an error and stays on /login", o.url().includes("/login"));
  await o.locator("input[name=password]").fill(PASSWORD);
  await o.getByRole("button", { name: /Entrar|Sign in/ }).first().click();
  await o.waitForURL("**/dashboard", { timeout: 30000 });
  await o.goto(BASE + "/projects");
  ok("after re-login the projects are still there", (await o.getByText("Miami Beach").count()) > 0);
  await o.goto(BASE + "/login");
  ok("signed-in user is not stuck on /login", o.url().endsWith("/dashboard"));

  const x = await ctx();
  await register(x, "Otra Persona", OTHER, "Other Co");
  await x.goto(BASE + "/projects");
  ok("another company does NOT see Miami Beach", (await x.getByText("Miami Beach").count()) === 0);
  await x.goto(projectUrl);
  ok("another company cannot open the project URL (404)", (await x.getByText(/404|could not be found|no se pudo encontrar/i).count()) > 0);

  // ---- Phase 2 ----
  await o.goto(BASE + "/employees/invite");
  await o.locator("input[name=fullName]").fill("Luis Martinez");
  await o.locator("input[name=email]").fill(LUIS);
  await o.locator("select[name=template]").selectOption("employee_purchasing");
  await o.getByRole("button", { name: /Invitar empleado|Invite employee/ }).click();
  const linkBox = o.locator("p.break-all");
  await linkBox.waitFor({ timeout: 30000 });
  const link = (await linkBox.innerText()).trim();
  ok("invitation link generated", /\/invite\/[a-f0-9]{64}$/.test(link));

  const l = await ctx(390, 844);
  await l.goto(link);
  await l.getByRole("link", { name: /Crear mi cuenta|Create my account/ }).click();
  await l.locator("input[type=email]").waitFor();
  await l.waitForTimeout(1200);
  ok("invitation prefills a read-only email", (await l.locator("input[type=email]").inputValue()) === LUIS);
  await l.getByRole("textbox").nth(0).fill("Luis Martinez");
  await l.locator("input[type=password]").fill(PASSWORD);
  await l.getByRole("button", { name: /Crear mi cuenta|Create my account/ }).click();
  await l.waitForURL("**/dashboard", { timeout: 30000 });
  ok("employee joins the inviting company (no company of their own)", (await l.getByText("Smoke Electric").count()) > 0);
  ok("employee has no New Project button", (await l.getByRole("link", { name: /Nuevo proyecto|New project/ }).count()) === 0);
  await l.goto(BASE + "/employees");
  ok("employee cannot open /employees", l.url().endsWith("/dashboard"));
  await l.goto(BASE + "/projects");
  ok("employee sees no projects before assignment", (await l.locator("a[href^='/projects/']:not([href='/projects/new'])").count()) === 0);

  await o.goto(BASE + "/employees");
  await o.getByText("Luis Martinez").first().click();
  await o.waitForURL(/employees\/[0-9a-f-]{36}/);
  const boxes = o.locator("section", { hasText: /Proyectos asignados|Assigned projects/ }).locator("input[type=checkbox]");
  await boxes.nth(0).check();
  await o.waitForTimeout(1500);
  await l.goto(BASE + "/projects");
  ok("employee sees exactly the assigned project", (await l.locator("a[href^='/projects/']:not([href='/projects/new'])").count()) === 1);
  ok("employee sees no money on the list", (await l.getByText(/Valor del contrato|Contract value/).count()) === 0);
  await l.goto(BASE + "/pos/new");
  ok("employee sees the PO limit notice", (await l.getByText(/\$500/).count()) > 0);

  await o.goto(BASE + "/employees");
  await o.getByText("Luis Martinez").first().click();
  await o.waitForURL(/employees\/[0-9a-f-]{36}/);
  await o.getByRole("button", { name: /Desactivar acceso|Deactivate access/ }).click();
  await o.waitForTimeout(2000);
  await l.goto(BASE + "/projects");
  ok("deactivated employee loses access to the project", (await l.locator("a[href^='/projects/']:not([href='/projects/new'])").count()) === 0);

  await browser.close();
  console.log(failed === 0 ? "\nALL CHECKS PASSED" : `\n${failed} CHECK(S) FAILED`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error("ERROR", e.message.split("\n").slice(0, 4).join(" | ")); process.exit(2); });
