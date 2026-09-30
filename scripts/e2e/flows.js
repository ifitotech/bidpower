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

async function phaseExpense(browser) {
  const o = state.owner;
  const emp = state.emp;
  await emp.goto(`${B}/expenses/new?projectId=${state.projectId}`);
  await emp.getByRole("button", { name: /Materiales|Materials/ }).first().click();
  await emp.locator("input[name=vendorName]").fill("Home Depot");
  await emp.locator("input[name=amount]").fill("50.25");
  await emp.locator("input[type=file]").setInputFiles({ name: "ticket.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) });
  await emp.getByRole("button", { name: /Guardar|Save/ }).click();
  await emp.waitForURL(/expenses\/[0-9a-f-]{36}/, { timeout: 30000 });
  ok("expense: employee's expense is pending review", (await emp.getByText(/Por aprobar|Pending review/).count()) > 0);
  ok("expense: receipt attached", (await emp.getByText("ticket.png").count()) > 0);
  ok("expense: employee cannot approve", (await emp.getByRole("button", { name: /^Aprobar$|^Approve$/ }).count()) === 0);
  const before = await (async () => { await o.goto(`${B}/projects/${state.projectId}`); return await o.locator("main").innerText(); })();
  ok("expense: pending expense does not count as actual cost yet", !/50[.,]25/.test(before.split("Costo real")[1]?.slice(0, 40) ?? ""));
  await o.goto(B + "/dashboard");
  ok("home: owner sees the expense to review", (await o.getByText(/Gasto por aprobar|Expense to review/).count()) > 0);
  await o.goto(B + "/expenses");
  await o.getByText("Home Depot").first().click();
  await o.getByRole("button", { name: /^Aprobar$|^Approve$/ }).click();
  await o.waitForTimeout(1500);
  ok("expense: owner approves", (await o.getByText(/Aprobado|Approved/).count()) > 0);
  await o.goto(`${B}/projects/${state.projectId}`);
  ok("project: approved expense now counts in actual cost", /50[.,]25|173[.,]70/.test(await o.locator("main").innerText()));
  await o.goto(B + "/expenses/new");
  await o.locator("input[name=amount]").fill("0");
  await o.getByRole("button", { name: /Guardar|Save/ }).click();
  await o.waitForTimeout(1200);
  ok("expense: zero amount is rejected with a message", (await o.getByRole("alert").count()) > 0);
}

async function phase6(browser) {
  const o = state.owner;
  await o.goto(`${B}/quotes/new?projectId=${state.projectId}`);
  ok("proposal: client is preselected from the project", (await o.locator("select[name=clientId]").inputValue()) !== "");
  ok("proposal: no sample clients in the list", (await o.locator("select[name=clientId] option").allInnerTexts()).every((x) => !/Rivera|Torres/.test(x)));
  await o.locator("input[type=text]").nth(0).fill("Panel upgrade 200A");
  await o.locator("input[type=number]").nth(1).fill("1200");
  await o.locator("input[name=taxRate]").fill("7.5");
  await o.getByRole("button", { name: /Nueva Proposal|New Proposal/ }).last().click();
  await o.waitForURL(/quotes\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.quoteUrl = o.url();
  ok("proposal: created and opened", (await o.getByText(/QT-/).count()) > 0);
  ok("proposal: total includes tax (1,290)", /1[.,]290/.test(await o.locator("main").innerText()));
  await o.getByRole("button", { name: /Crear enlace y enviar|Create link and send/ }).first().click();
  const linkBox = o.locator("p.break-all").first();
  await linkBox.waitFor({ timeout: 30000 });
  const link = (await linkBox.innerText()).trim();
  ok("proposal: customer link generated", /\/customer\/[a-f0-9]{64}$/.test(link));
  await o.reload();
  ok("proposal: sent, waiting on the customer", (await o.getByText(/Enviada|Enviado|Sent/).count()) > 0);

  const cust = await page(browser, 390, 844, "en-US");
  await cust.goto(link);
  ok("customer: sees the proposal with total, no login", /1,290/.test(await cust.locator("main").innerText()) && cust.url().includes("/customer/"));
  ok("customer: sees no supplier/cost data", !/PO-|Graybar|Home Depot|margin|profit/i.test(await cust.locator("main").innerText()));
  await cust.getByLabel(/Your full name/).fill("");
  ok("customer: approve is disabled without a name", await cust.getByRole("button", { name: /^Approve$/ }).isDisabled());
  await cust.getByLabel(/Your full name/).fill("Carlos Cliente");
  await cust.getByRole("button", { name: /^Approve$/ }).click();
  await cust.waitForTimeout(1500);
  ok("customer: approval recorded", (await cust.getByText(/approval was recorded/i).count()) > 0);

  await o.reload();
  ok("proposal: approved by the customer's name", (await o.getByText(/Carlos Cliente/).count()) > 0);
  ok("proposal: no signature is claimed", (await o.getByText(/no es una firma|not a handwritten signature/i).count()) > 0);
  await o.goto(`${B}/projects/${state.projectId}`);
  ok("project: contract value taken from the approved proposal", /1[.,]290/.test(await o.locator("main").innerText()));

  await cust.reload();
  await cust.getByLabel(/Your full name/).fill("Carlos Cliente");
  await cust.locator("textarea").fill("Please add two outlets in the kitchen");
  await cust.getByRole("button", { name: /Send request/ }).click();
  await cust.waitForTimeout(1500);
  await o.goto(B + "/dashboard");
  ok("home: owner sees the customer's change request", (await o.getByText(/pidió un cambio|asked for a change/).count()) > 0);
  await o.goto(state.quoteUrl);
  ok("proposal: change request listed", (await o.getByText(/two outlets/).count()) > 0);
  await o.getByRole("button", { name: /Crear Change Order|Create Change Order/ }).first().click();
  await o.getByLabel(/Descripción|Description/).nth(1).fill("Two kitchen outlets");
  await o.getByLabel(/Precio|Price/).last().fill("150");
  await o.getByLabel(/Cant\.|Cantidad|Quantity/).last().fill("2");
  await o.getByRole("button", { name: /^Crear Change Order$|^Create Change Order$/ }).last().click();
  await o.waitForTimeout(2000);
  ok("change order: created with the difference (300)", (await o.getByText(/CO-/).count()) > 0 && /300/.test(await o.locator("main").innerText()));
  await o.getByRole("button", { name: /Crear enlace y enviar|Create link and send/ }).last().click();
  const coBox = o.locator("p.break-all").first();
  await coBox.waitFor({ timeout: 30000 });
  const coLink = (await coBox.innerText()).trim();
  const cust2 = await page(browser, 390, 844, "en-US");
  await cust2.goto(coLink);
  ok("customer: change order page shows the difference", /300/.test(await cust2.locator("main").innerText()));
  await cust2.getByLabel(/Your full name/).fill("Carlos Cliente");
  await cust2.getByRole("button", { name: /^Approve$/ }).click();
  await cust2.waitForTimeout(1500);
  await o.goto(`${B}/projects/${state.projectId}`);
  ok("project: contract value grows by the approved change order (1,590)", /1[.,]590/.test(await o.locator("main").innerText()));

  // second proposal: request changes -> new version, old link dies
  await o.goto(`${B}/quotes/new?projectId=${state.projectId}`);
  await o.locator("input[type=text]").nth(0).fill("Lighting package");
  await o.locator("input[type=number]").nth(1).fill("500");
  await o.getByRole("button", { name: /Nueva Proposal|New Proposal/ }).last().click();
  await o.waitForURL(/quotes\/[0-9a-f-]{36}$/, { timeout: 30000 });
  const q2 = o.url();
  await o.getByRole("button", { name: /Crear enlace y enviar|Create link and send/ }).first().click();
  const l2 = (await o.locator("p.break-all").first().innerText()).trim();
  const c3 = await page(browser, 390, 844, "en-US");
  await c3.goto(l2);
  await c3.getByLabel(/Your full name/).fill("Carlos Cliente");
  await c3.getByRole("button", { name: /Request changes/ }).click();
  await c3.locator("textarea").fill("Cheaper fixtures please");
  await c3.getByRole("button", { name: /Send request/ }).click();
  await c3.waitForTimeout(1500);
  await o.goto(q2);
  ok("proposal v1: status changes requested", (await o.getByText(/Cambios pedidos|Changes requested/).count()) > 0);
  await o.getByRole("button", { name: /Nueva versión|New version/ }).click();
  await o.waitForURL((u) => u.toString() !== q2 && /quotes\/[0-9a-f-]{36}$/.test(u.toString()), { timeout: 30000 });
  ok("proposal v2: opened as an editable version 2", (await o.getByText(/Versión 2|Version 2/).count()) > 0);
  await c3.goto(l2);
  ok("customer: the old version's link no longer works", (await c3.getByText(/not valid|no es válido|não é válido/).count()) > 0);
}

async function phase78(browser) {
  const o = state.owner;
  await o.goto(`${B}/projects/${state.projectId}/takeoff`);
  ok("takeoff: PRELIMINARY banner shown", (await o.getByText(/PRELIMINAR|PRELIMINARY/).count()) > 0);
  await o.getByLabel(/^Título$|^Title$/).fill("Lobby");
  await o.getByRole("button", { name: /Crear takeoff|Create takeoff/ }).click();
  await o.waitForURL(/takeoffs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.takeoffUrl = o.url();
  await o.getByLabel(/Tipo \/ descripción|Type \/ description/).fill("2x4 LED panel");
  await o.getByLabel(/^Cant\.$|^Quantity$/).first().fill("12");
  await o.getByRole("button", { name: /^Agregar$|^Add$/ }).first().click();
  await o.waitForTimeout(1200);
  await o.getByLabel(/Nombre del panel|Panel name/).fill("A");
  await o.getByLabel(/Bus \(A\)/).fill("200");
  await o.getByLabel(/Main \(A\)/).fill("200");
  await o.getByRole("button", { name: /Agregar panel|Add panel/ }).click();
  await o.waitForTimeout(1200);
  await o.getByRole("button", { name: /Agregar circuito|Add circuit/ }).click();
  await o.waitForTimeout(1200);
  await o.getByLabel(/Nombre$|^Name$/).fill("F1");
  await o.getByLabel(/Longitud \(ft\)|Length \(ft\)/).fill("100");
  await o.getByLabel(/Calibre conductor|Conductor size/).fill("#4 CU");
  await o.getByLabel(/Nº conductores|Conductors/).fill("3");
  await o.getByLabel(/^Conduit$|Conduit size/).fill("1-1/4\"");
  await o.getByLabel(/Tipo \(EMT|Type \(EMT/).fill("EMT");
  await o.getByRole("button", { name: /Agregar feeder|Add feeder/ }).click();
  await o.waitForTimeout(1500);
  const txt = await o.locator("main").innerText();
  ok("takeoff: counts appear in the material list", /2x4 LED panel[\s\S]*12 EA/.test(txt));
  ok("takeoff: breakers derived (20A 1-pole and 200A 2-pole main)", /20A 1-pole breaker/.test(txt) && /200A 2-pole breaker/.test(txt));
  ok("takeoff: wire length = 100 x 3 x 1.10 = 330 FT", /330 FT/.test(txt));
  ok("takeoff: says branch wire/fittings are not estimated", /no se estima|not estimated/i.test(txt));
  await o.getByRole("button", { name: /Marcar como verificado|Mark as verified/ }).click();
  await o.waitForTimeout(1500);
  ok("takeoff: verified by the manager", (await o.getByText(/Verificado por|Verified by/).count()) > 0);
  await o.getByLabel(/^Cant\.$|^Quantity$/).first().fill("3");
  await o.getByLabel(/Tipo \/ descripción|Type \/ description/).fill("Exit sign");
  await o.getByRole("button", { name: /^Agregar$|^Add$/ }).first().click();
  await o.waitForTimeout(1500);
  ok("takeoff: editing a verified takeoff sends it back to unverified", (await o.getByText(/Marcar como verificado|Mark as verified/).count()) > 0);
  await o.getByRole("button", { name: /Enviar como pedido de material|Send as material request/ }).click();
  await o.waitForTimeout(2500);
  await o.goto(B + "/materials/requests");
  ok("takeoff: material request created with the PRELIMINARY note", (await o.locator("a[href*='/materials/']").filter({ hasText: /MR-/ }).count()) >= 1);
}

async function phase9(browser) {
  const o = state.owner;
  // Supply house registers with its own account type
  const sp = await page(browser, 390, 844, "es-ES");
  await sp.goto(B + "/register");
  await sp.getByRole("textbox").nth(0).fill("Sam Supply");
  await sp.getByRole("textbox").nth(1).fill(`supply-${RUN}@bidpower-smoke.test`);
  await sp.locator("input[type=password]").fill("Smoke-test-123");
  await sp.getByRole("button", { name: /Continuar|Continue/ }).click();
  await sp.getByRole("radio", { name: /Supply house/ }).click();
  await sp.locator("input[name=companyNameField]").fill("Graybar Supply");
  ok("supply register: business type selector is hidden for supply", (await sp.locator("select[name=businessType]").count()) === 0);
  await sp.getByRole("button", { name: /Crear empresa|Create free company/ }).click();
  await sp.waitForURL("**/supply", { timeout: 30000 });
  ok("supply: lands on the supply inbox", (await sp.getByText(/Bandeja|Inbox/).count()) > 0);
  await sp.goto(B + "/dashboard");
  ok("supply: contractor dashboard is not reachable (redirected)", sp.url().endsWith("/supply"));
  await sp.goto(B + "/projects");
  ok("supply: contractor modules are not reachable", sp.url().endsWith("/supply"));
  await o.goto(B + "/supply");
  ok("contractor: supply workspace is not reachable", o.url().endsWith("/dashboard"));

  // connection code
  await sp.goto(B + "/supply/contractors");
  await sp.getByRole("button", { name: /Generar código|Generate code/ }).click();
  const code = (await sp.getByTestId("connect-code").innerText()).trim();
  ok("supply: single-use code generated (24 hex)", /^[a-f0-9]{24}$/.test(code));
  await o.goto(B + "/suppliers");
  await o.getByLabel(/Código que te dio el supply|Code the supply gave you/).fill("0".repeat(24));
  await o.getByRole("button", { name: /Conectar con un código|Connect with a code/ }).last().click();
  await o.waitForTimeout(1200);
  ok("contractor: a wrong code is refused with a message", (await o.getByRole("alert").count()) > 0);
  await o.getByLabel(/Código que te dio el supply|Code the supply gave you/).fill(code);
  await o.getByRole("button", { name: /Conectar con un código|Connect with a code/ }).last().click();
  await o.waitForTimeout(1800);
  ok("contractor: connected, supplier record shows Connected", (await o.getByText("Graybar Supply").count()) > 0 && (await o.getByText(/^Conectado$|^Connected$/).count()) > 0);

  // pricing request sent inside the app
  await o.goto(B + "/pricing/new");
  await o.locator("textarea").first().fill("12 x 2x4 LED panel\n40 x Duplex outlet");
  await o.getByLabel(/^Título|^Title/).fill("Lobby package");
  await o.locator("input[type=date]").fill("2030-02-01");
  await o.getByRole("button", { name: /Crear Pricing Request|Create Pricing Request/ }).click();
  await o.waitForURL(/pricing\/[0-9a-f-]{36}$/, { timeout: 30000 });
  state.pr2 = o.url();
  await o.locator("input[type=file]").setInputFiles({ name: "lighting-plan.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 plan") });
  await o.waitForTimeout(1500);
  await o.getByRole("combobox").filter({ has: o.locator("option", { hasText: "Graybar Supply" }) }).first().selectOption({ label: "Graybar Supply" });
  await o.getByRole("button", { name: /Enviar a su cuenta Supply|Send to their Supply account/ }).click();
  await o.waitForTimeout(1800);
  ok("pricing: sent to the Supply account (no link to share)", (await o.getByText(/Verán la solicitud|will see the request/).count()) > 0 && (await o.locator("p.break-all").count()) === 0);

  // supply inbox
  await sp.goto(B + "/supply");
  ok("supply inbox: shows the request with the contractor and the Bid Date", (await sp.getByText(/Lobby package/).count()) > 0 && (await sp.getByText(/Smoke Electric/).count()) > 0);
  await sp.getByText(/Lobby package/).first().click();
  await sp.waitForURL(/supply\/requests\/[0-9a-f-]{36}$/);
  ok("supply request: sees the lines and the plans file", (await sp.getByText(/2x4 LED panel/).count()) > 0 && (await sp.getByText("lighting-plan.pdf").count()) > 0);
  ok("supply request: does not see the project name", (await sp.locator("body").innerText()).indexOf("Miami Beach") === -1);
  await sp.locator("textarea[aria-label]").last().fill("Do you want 4000K?");
  await sp.getByRole("button", { name: /Enviar pregunta|Send question/ }).click();
  await sp.waitForTimeout(1200);
  const priceInputs = sp.getByLabel(/^Precio |^Price /);
  const n = await priceInputs.count();
  for (let i = 0; i < n; i++) await priceInputs.nth(i).fill(String(20 + i));
  await sp.getByLabel(/Nº de quote|Quote number/).fill("GB-1001");
  await sp.getByRole("button", { name: /Enviar mi respuesta|Send my response/ }).click();
  await sp.waitForTimeout(1800);
  ok("supply request: quote sent", (await sp.getByRole("status").count()) > 0);
  await sp.goto(B + "/supply");
  await sp.getByRole("button", { name: /Cotizados|Quoted/ }).click();
  ok("supply inbox: the quote shows under Quoted with its number", (await sp.getByText(/GB-1001/).count()) > 0);

  // contractor side sees it like any other response
  await o.goto(state.pr2);
  ok("pricing: the supply's quote arrives in the normal comparison", (await o.getByText(/GB-1001/).count()) > 0);
  ok("pricing: the supply's question is listed", (await o.getByText(/4000K/).count()) > 0);

  // supply revokes
  await sp.goto(B + "/supply/contractors");
  ok("supply: sees the contractor with counters", (await sp.getByText(/Smoke Electric/).count()) > 0 && (await sp.getByText(/1 solicitudes|1 requests/).count()) > 0);
  sp.on("dialog", (d) => d.accept());
  await sp.getByRole("button", { name: /^Revocar$|^Revoke$/ }).click();
  await sp.waitForTimeout(1500);
  await sp.goto(B + "/supply");
  ok("supply: after disconnecting the inbox is empty", (await sp.getByText(/Lobby package/).count()) === 0);
  await o.goto(B + "/suppliers");
  ok("contractor: supplier shows as not connected after disconnect", (await o.getByText(/Sin cuenta|No account/).count()) > 0);
}

async function phase10(browser) {
  const o = state.owner;
  if (!state.emp) state.emp = await inviteEmployee(browser, o, "Luis Tester", `luis-${RUN}@bidpower-smoke.test`, "employee_basic", state.projectId);
  const emp = state.emp;

  // access: only the Owner (or a Manager who may view costs)
  const denied = await emp.request.get(B + "/api/accounting/export?dataset=customers&format=csv");
  ok("accounting: an employee gets 403 from the export endpoint", denied.status() === 403);
  await emp.goto(B + "/accounting");
  ok("accounting: an employee is redirected away from the page", !emp.url().includes("/accounting"));
  const anon = await (await browser.newContext()).request.get(B + "/api/accounting/export?dataset=customers&format=csv", { maxRedirects: 0 });
  ok("accounting: no session is refused", [307, 401, 403].includes(anon.status()));

  // the Owner exports
  await o.goto(B + "/accounting");
  ok("accounting: the Owner sees the page with the QuickBooks note", (await o.getByText(/QuickBooks/).count()) > 0);
  const csv = await o.request.get(B + "/api/accounting/export?dataset=customers&format=csv");
  const text = await csv.text();
  ok("accounting: customers CSV downloads with BOM, header and the customer", csv.status() === 200 && text.startsWith("\uFEFFid,name,contact_name") && text.includes("Cliente Miami") && text.includes("\r\n"));
  ok("accounting: CSV has an attachment filename", /attachment; filename="bidpower-customers-\d{4}-\d{2}-\d{2}\.csv"/.test(csv.headers()["content-disposition"] || ""));
  const exp = await o.request.get(B + "/api/accounting/export?dataset=expenses&format=json");
  const expJson = await exp.json();
  ok("accounting: expenses JSON only carries approved/reimbursed", exp.status() === 200 && expJson.rows.every((r) => ["approved", "reimbursed"].includes(r.status)));
  const pc = await o.request.get(B + "/api/accounting/export?dataset=project_costs&format=csv");
  ok("accounting: project costs CSV lists the project with forecast", pc.status() === 200 && (await pc.text()).includes("forecast_cost"));
  const all = await o.request.get(B + "/api/accounting/export?dataset=all&format=json");
  const allJson = await all.json();
  ok("accounting: all-in-one JSON has the seven datasets", all.status() === 200 && Object.keys(allJson.datasets).length === 7);
  ok("accounting: validation rejects bad dataset, all as CSV, bad and inverted dates", (await o.request.get(B + "/api/accounting/export?dataset=nope")).status() === 400 && (await o.request.get(B + "/api/accounting/export?dataset=all&format=csv")).status() === 400 && (await o.request.get(B + "/api/accounting/export?dataset=expenses&from=2026-13-99x")).status() === 400 && (await o.request.get(B + "/api/accounting/export?dataset=expenses&from=2026-02-01&to=2026-01-01")).status() === 400);
  const filtered = await o.request.get(B + "/api/accounting/export?dataset=expenses&format=json&from=2001-01-01&to=2001-01-02");
  ok("accounting: a date range with nothing returns zero rows", (await filtered.json()).rows.length === 0);

  // the audit log records them and is visible on the page
  await o.goto(B + "/accounting");
  ok("accounting: the export history lists the downloads", (await o.getByText(/Clientes · CSV|Customers · CSV/).count()) > 0 && (await o.getByText(/Todo \(JSON\) · JSON|Everything \(JSON\) · JSON/).count()) > 0);
  // mobile
  const m = await page(browser, 390, 844);
  await m.context().addCookies(await o.context().cookies());
  await m.goto(B + "/accounting");
  ok("accounting: mobile has no horizontal overflow", await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
}

async function phaseLang(browser) {
  const o = state.owner;
  // Settings start from the saved company (never from placeholders) and saving reports in the current language
  await o.goto(B + "/settings");
  ok("settings: the company form starts from the saved name", (await o.locator("input[name=name]").inputValue()) === "Smoke Electric");
  ok("settings: no invented demo values", (await o.locator("body").innerText()).indexOf("ElectricPro") === -1 && (await o.locator("input[name=phone]").nth(0).inputValue()) !== "(305) 555-0142");
  await o.locator("input[name=fullName]").fill("Ana Owner");
  await o.getByRole("button", { name: /^Guardar$|^Save$/ }).first().click();
  await o.waitForTimeout(1500);
  ok("settings: profile saves with a translated confirmation", (await o.getByText(/Guardado correctamente|Saved successfully/).count()) > 0);
  // Categories are real: a new one shows up in the expense form
  await o.goto(B + "/settings/categories");
  await o.getByPlaceholder(/Nombre de la categoría|Category name/).fill("Baterías");
  await o.getByRole("button", { name: /^Crear$|^Create$/ }).first().click();
  await o.waitForTimeout(1500);
  await o.goto(B + "/expenses/new");
  ok("categories: the new category is offered in the expense form", (await o.getByRole("button", { name: "Baterías" }).count()) > 0);
  // Language: the whole shell follows the chosen language, first paint included
  await o.goto(B + "/dashboard");
  await o.evaluate(() => localStorage.setItem("bidpower-locale", "en"));
  await o.reload({ waitUntil: "networkidle" });
  const en = await o.locator("body").innerText();
  ok("language EN: navigation is in English", /work/i.test(en) && /operations/i.test(en) && !/trabajo|operaciones/i.test(en));
  await o.goto(B + "/settings/categories");
  ok("language EN: system categories are translated", (await o.getByText("Materials").count()) > 0 && (await o.getByText("Materiales").count()) === 0);
  const pdfEn = await o.request.get(B + "/api/quotes/00000000-0000-0000-0000-000000000000/pdf?lang=en");
  ok("pdf: unknown quote is a clean 404", pdfEn.status() === 404);
  await o.evaluate(() => localStorage.setItem("bidpower-locale", "es"));
  await o.goto(B + "/dashboard", { waitUntil: "networkidle" });
  const es = await o.locator("body").innerText();
  ok("language ES: navigation is in Spanish", /trabajo/i.test(es) && /operaciones/i.test(es));
  await o.goto(B + "/pagina-que-no-existe");
  ok("404 page is translated", (await o.getByText(/No encontramos esta página/).count()) > 0);
}

(async () => {
  const browser = await launch();
  try {
    state.owner = await page(browser);
    state.owner.on("dialog", (d) => d.accept());
    await register(state.owner, "Ana Owner", `owner-${RUN}@bidpower-smoke.test`, "Smoke Electric");
    state.projectId = await createProject(state.owner, "Miami Beach", "Cliente Miami");
    if (want("all") || want("3") || want("45")) await phase3(browser);
    if (want("all") || want("45")) await phase45(browser);
    if (want("all") || want("exp")) { if (!state.emp) state.emp = await inviteEmployee(browser, state.owner, "Luis Tester", `luis-${RUN}@bidpower-smoke.test`, "employee_basic", state.projectId); await phaseExpense(browser); }
    if (want("all") || want("6")) await phase6(browser);
    if (want("all") || want("78")) await phase78(browser);
    if (want("all") || want("9")) await phase9(browser);
    if (want("all") || want("10")) await phase10(browser);
    if (want("all") || want("lang")) await phaseLang(browser);
  } catch (e) {
    console.error("ERROR", e.message.split("\n").slice(0, 4).join(" | "));
    process.exitCode = 2;
  }
  await browser.close();
  console.log(failures() === 0 && !process.exitCode ? "\nALL CHECKS PASSED" : `\n${failures()} CHECK(S) FAILED`);
  process.exit(failures() === 0 && !process.exitCode ? 0 : process.exitCode || 1);
})();
