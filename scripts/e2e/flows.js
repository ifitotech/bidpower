#!/usr/bin/env node
// End-to-end flows (phases 3+), run against the local harness (real PostgREST + RLS).
const { BASE: B, RUN, ok, failures, launch, page, register, createProject, inviteEmployee } = require("./lib");
const only = process.argv[2] || "all";
const want = (n) => only === "all" || only === n;
const state = {};

async function phase3(browser) {
  const o = state.owner;
  // library
  await o.goto(B + "/materials");
  await o.getByRole("button", { name: /Agregar ítem|Add item/ }).click();
  await o.getByLabel(/Descripción|Description/).first().fill("3/4 in EMT conduit");
  await o.getByLabel(/Apodos|Nicknames/).fill("emt, tubo");
  await o.getByLabel(/Unidad|Unit/).selectOption("FT");
  await o.getByRole("button", { name: /^Guardar$|^Save$/ }).click();
  await o.waitForTimeout(1500);
  ok("library: item saved and listed", (await o.getByText("3/4 in EMT conduit").count()) > 0);
  await o.getByRole("button", { name: /Favorito|Favorite/ }).first().click();
  await o.waitForTimeout(1000);
  ok("library: favorite toggles", (await o.getByRole("button", { name: /Favorito|Favorite/ }).first().getAttribute("aria-pressed")) === "true");

  // request builder as owner
  await o.goto(`${B}/projects/${state.projectId}/materials/new`);
  await o.getByPlaceholder(/Busca un ítem|Search an item/).fill("tubo");
  ok("request: alias search finds the library item", (await o.getByRole("button", { name: /3\/4 in EMT conduit/ }).count()) > 0);
  await o.getByRole("button", { name: /3\/4 in EMT conduit/ }).first().click();
  await o.getByRole("button", { name: /Pegar lista|Paste list/ }).click();
  await o.locator("textarea").first().fill("20 x 12/2 Romex 250ft\n5 ea Mud ring\n3/4 in EMT conduit x 10");
  await o.getByRole("button", { name: /Agregar 3 líneas|Add 3 lines/ }).click();
  ok("request: pasted list merges with library item (3 lines)", (await o.getByText(/Ítems del pedido \(3\)|Request items \(3\)/).count()) > 0, await o.locator("h2").allInnerTexts().then((a) => a.join("|")));
  await o.getByRole("button", { name: /Enviar pedido|Send request/ }).click();
  await o.waitForURL(/materials\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.mrUrl = o.url();
  ok("request: created with a number MR-", (await o.locator("h1").innerText()).startsWith("MR-"));
  ok("request: total quantity of the library item is 11", (await o.getByText(/11 FT/).count()) > 0);

  // employee with request permission (template employee_basic has can_request_material)
  const emp = await inviteEmployee(browser, o, "Luis Tester", `luis-${RUN}@bidpower-smoke.test`, "employee_basic", state.projectId);
  state.emp = emp;
  await emp.goto(`${B}/projects/${state.projectId}/materials/new`);
  await emp.getByPlaceholder(/Busca un ítem|Search an item/).fill("Breaker 20A");
  await emp.getByRole("button", { name: /Agregar "Breaker 20A"|Add "Breaker 20A"/ }).click();
  await emp.getByRole("button", { name: /Enviar pedido|Send request/ }).click();
  await emp.waitForURL(/materials\/[0-9a-f-]{36}$/, { timeout: 30000 });
  ok("employee: can create a request", true);
  await emp.goto(`${B}/projects/${state.projectId}/materials`);
  ok("employee: sees only own request (1)", (await emp.locator("a[href*='/materials/']").filter({ hasText: /MR-/ }).count()) === 1);
  await emp.goto(B + "/materials");
  ok("employee: library management is not open to them", emp.url().endsWith("/dashboard"));
  await emp.goto(B + "/materials/requests");
  ok("employee: cannot open the review list", emp.url().endsWith("/dashboard"));

  // owner review
  await o.goto(B + "/materials/requests");
  ok("owner: sees both requests", (await o.locator("a[href*='/materials/']").filter({ hasText: /MR-/ }).count()) === 2);
  await o.locator("a[href*='/materials/']").filter({ hasText: /Luis/ }).first().click();
  await o.getByRole("button", { name: /Marcar como revisado|Mark as reviewed/ }).click();
  await o.waitForTimeout(1500);
  ok("owner: review moves the request to reviewed", (await o.getByText(/Revisado|Reviewed/).count()) > 0);
  await o.goto(B + "/dashboard");
  ok("home: needs attention lists the pending request", (await o.getByText(/por revisar|to review/).count()) > 0);
}


async function phase45(browser) {
  const o = state.owner;
  // Pricing Request from the reviewed Material Request of the employee
  await o.goto(B + "/pricing/new");
  await o.getByLabel(/Desde un pedido de material|From a material request/).selectOption({ index: 1 });
  await o.getByLabel(/^Título|^Title/).fill("Panel package");
  await o.locator("input[type=date]").fill("2030-01-15");
  await o.getByRole("button", { name: /Crear Pricing Request|Create Pricing Request/ }).click();
  await o.waitForURL(/pricing\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.prUrl = o.url();
  ok("pricing: created with number PR-", (await o.locator("h1").innerText()).startsWith("PR-"));
  ok("pricing: lines copied from the material request", (await o.locator("ul li").filter({ hasText: /Breaker 20A|3\/4 in EMT/ }).count()) >= 1);

  // plans / files
  await o.locator("input[type=file]").setInputFiles({ name: "specs.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
  await o.waitForTimeout(1500);
  ok("pricing: file attached and listed", (await o.getByText("specs.pdf").count()) > 0);

  // secure link for Supply
  await o.getByLabel(/Nuevo supplier|New supplier/).first().fill("Graybar");
  await o.getByRole("button", { name: /Crear enlace seguro|Create secure link/ }).first().click();
  const linkBox = o.locator("p.break-all").first();
  await linkBox.waitFor({ timeout: 30000 });
  const link = (await linkBox.innerText()).trim();
  ok("pricing: supplier link generated", /\/supplier\/[a-f0-9]{64}$/.test(link));
  await o.reload();
  ok("pricing: request is sent, waiting on supplier", (await o.getByText(/Enviado|Sent/).count()) > 0);

  // Supply, no account
  const sup = await page(browser, 390, 844, "en-US");
  await sup.goto(link);
  ok("supplier: sees company, no login", (await sup.locator("h1").innerText()).includes("Smoke Electric") && sup.url().includes("/supplier/"));
  ok("supplier: does NOT see the project name", (await sup.locator("body").innerText()).indexOf("Miami Beach") === -1);
  await sup.locator("textarea[aria-label]").last().fill("Is 3/4 EMT ok?");
  await sup.getByRole("button", { name: /Send question/ }).click();
  await sup.waitForTimeout(1200);
  await o.reload();
  ok("pricing: supplier question opens the request (waiting on owner)", (await o.getByText(/Preguntas del supplier|Supplier questions/).count()) > 0);
  await o.getByPlaceholder(/^Responder$|^Reply$/).fill("Yes, 3/4 EMT is fine");
  await o.getByRole("button", { name: /^Responder$|^Reply$/ }).click();
  await o.waitForTimeout(1200);

  await sup.reload();
  const priceInputs = sup.getByLabel(/^Price /);
  const n = await priceInputs.count();
  for (let i = 0; i < n; i++) await priceInputs.nth(i).fill(String(10 + i));
  await sup.getByLabel(/Quote number/).fill("Q-778");
  await sup.getByRole("button", { name: /Send my response/ }).click();
  await sup.waitForTimeout(1500);
  ok("supplier: response accepted", (await sup.getByRole("status").count()) > 0);

  await o.reload();
  ok("pricing: response shows quote number and total", (await o.getByText(/Q-778/).count()) > 0);
  await o.getByRole("button", { name: /Adjudicar|Award/ }).first().click().catch(() => {});
  o.once("dialog", (d) => d.accept());
  await o.waitForTimeout(800);

  // Purchase Order from the response
  await o.getByRole("button", { name: /Crear Purchase Order|Create purchase order/ }).first().click();
  await o.waitForURL(/\/pos\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.poUrl = o.url();
  ok("po: created from the supplier response, approved (owner has no limit)", (await o.getByText(/Aprobado|Approved/).count()) > 0);
  ok("po: lines carried over with prices", (await o.locator("ul li").filter({ hasText: /×/ }).count()) >= 1);
  await o.getByRole("button", { name: /Marcar como enviado al supplier|Mark as sent to supplier/ }).click();
  await o.waitForTimeout(1200);
  await o.getByRole("button", { name: /Marcar como recibido|Mark as received/ }).click();
  await o.waitForTimeout(1200);
  ok("po: received, receipt required to complete", (await o.getByText(/recibo, invoice o packing slip|receipt, invoice or packing slip/i).count()) > 0);
  ok("po: cannot complete without a document (no complete form)", (await o.getByRole("button", { name: /Completar PO|Complete PO/ }).count()) === 0);
  await o.locator("input[type=file]").setInputFiles({ name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 receipt") });
  await o.waitForTimeout(1800);
  await o.getByLabel(/Costo real \(del documento\)|Actual cost \(from the document\)/).fill("123.45");
  await o.getByRole("button", { name: /Completar PO|Complete PO/ }).click();
  await o.waitForTimeout(2000);
  ok("po: completed", (await o.getByText(/Completado|Completed/).count()) > 0);

  // project control
  await o.goto(`${B}/projects/${state.projectId}`);
  ok("project: actual cost includes the completed PO", (await o.getByText(/123[.,]45/).count()) > 0);
  ok("project: control panel and waiting/activity sections render", (await o.getByText(/Control del proyecto|Project control/).count()) > 0 && (await o.getByText(/Actividad|Activity/).count()) > 0);

  // employee with PO limit: over-limit PO waits for approval
  const lim = await inviteEmployee(browser, o, "Pedro Compras", `pedro-${RUN}@bidpower-smoke.test`, "employee_purchasing", state.projectId);
  await lim.goto(B + "/pos/new");
  await lim.locator("select[name=projectId]").selectOption({ index: 1 });
  await lim.locator("input[name=vendorName]").fill("Home Depot");
  await lim.locator("input[name=estimatedAmount]").fill("900");
  await lim.getByRole("button", { name: /Crear PO|Create PO|Crear Purchase Order/ }).click();
  await lim.waitForURL(/\/pos\/[0-9a-f-]{36}$/, { timeout: 30000 });
  ok("po limit: over the limit waits for approval", (await lim.getByText(/Por aprobar|Pending approval/).count()) > 0);
  ok("po limit: creator cannot approve", (await lim.getByRole("button", { name: /^Aprobar$|^Approve$/ }).count()) === 0);
  const limUrl = lim.url();
  await o.goto(B + "/dashboard");
  ok("home: owner sees the PO to approve", (await o.getByText(/por aprobar|to approve/i).count()) > 0);
  await o.goto(limUrl);
  await o.getByRole("button", { name: /^Aprobar$|^Approve$/ }).click();
  await o.waitForTimeout(1500);
  ok("po limit: owner approves", (await o.getByText(/Aprobado|Approved/).count()) > 0);
}

(async () => {
  const browser = await launch();
  try {
    state.owner = await page(browser);
    await register(state.owner, "Ana Owner", `owner-${RUN}@bidpower-smoke.test`, "Smoke Electric");
    state.projectId = await createProject(state.owner, "Miami Beach", "Cliente Miami");
    if (want("all") || want("3") || want("45")) await phase3(browser);
    if (want("all") || want("45")) await phase45(browser);
  } catch (e) {
    console.error("ERROR", e.message.split("\n").slice(0, 4).join(" | "));
    process.exitCode = 2;
  }
  await browser.close();
  console.log(failures() === 0 && !process.exitCode ? "\nALL CHECKS PASSED" : `\n${failures()} CHECK(S) FAILED`);
  process.exit(failures() === 0 && !process.exitCode ? 0 : process.exitCode || 1);
})();
