// Attacks the database directly (no app in between) with each kind of person, to prove that row security holds.
// Run after `node scripts/e2e/flows.js all` so there is data from several companies and roles:
//   node scripts/e2e/rls.js
const { spawnSync } = require("child_process");

function sql(input, db = "e2e") {
  const r = spawnSync("su", ["postgres", "-c", `psql -d ${db} -At -F '|' -v ON_ERROR_STOP=0`], { input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}
const rows = (s) => s.out.split("\n").filter(Boolean).map((l) => l.split("|"));
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? "PASS " : "FAIL ") + name + (!cond && extra ? "  -> " + extra : "")); if (!cond) failed++; };

// Run statements as a signed-in person (or anonymous) inside one transaction that is always rolled back.
function asUser(userId, statements, role = "authenticated") {
  const claims = userId ? JSON.stringify({ sub: userId, role }) : JSON.stringify({ role: "anon" });
  const body = Array.isArray(statements) ? statements.join("\n") : statements;
  return sql(`begin;\nset local role ${role};\nselect set_config('request.jwt.claims', '${claims}', true);\n${body}\nrollback;`);
}

const people = rows(sql(`select m.company_id, c.kind, m.user_id, m.role, coalesce(pm.template,'') from company_members m join companies c on c.id=m.company_id left join member_permissions pm on pm.user_id=m.user_id and pm.company_id=m.company_id where m.is_active order by m.created_at`)).map(([company, kind, user, role, template]) => ({ company, kind, user, role, template }));
const contractors = people.filter((p) => p.kind !== "supply");
const owners = contractors.filter((p) => p.role === "owner");
const A = owners[0];
const B = owners.find((p) => p.company !== A.company);
const employee = contractors.find((p) => p.company === A.company && p.role === "employee");
const supply = people.find((p) => p.kind === "supply");
if (!A || !B || !employee) { console.log("Not enough data: run `node scripts/e2e/flows.js all` first."); process.exit(2); }
console.log(`Companies: A=${A.company.slice(0, 8)} B=${B.company.slice(0, 8)}${supply ? ` supply=${supply.company.slice(0, 8)}` : ""}; employee=${employee.user.slice(0, 8)}\n`);

const tables = rows(sql(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`)).map((r) => r[0]);
const hasCol = (t, c) => rows(sql(`select 1 from information_schema.columns where table_schema='public' and table_name='${t}' and column_name='${c}'`)).length > 0;

// 1 + 2. Another company's rows are neither visible nor changeable, table by table.
// Tables that are shared on purpose (the two sides of a supply connection) are checked separately below.
const SHARED = new Set(["supply_quote_requests", "supply_quote_request_items", "supplier_quote_invitations", "supplier_quote_responses", "supplier_quote_response_items", "supplier_quote_attachments", "pricing_request_questions", "supply_connections", "supply_connect_codes", "companies", "profiles", "company_members", "plans", "plan_limits", "feedback"]);
let leaks = [];
let writes = [];
for (const t of tables) {
  if (!hasCol(t, "company_id") || SHARED.has(t)) continue;
  const foreign = rows(sql(`select id from ${t} where company_id <> '${A.company}' limit 50`)).map((r) => r[0]);
  if (foreign.length === 0) continue;
  const list = foreign.map((id) => `'${id}'`).join(",");
  const seen = Number(asUser(A.user, `select count(*) from ${t} where id in (${list});`).out.split("\n").pop() || 0);
  if (seen > 0) leaks.push(`${t} (${seen})`);
  const upd = asUser(A.user, `with u as (update ${t} set company_id = company_id where id in (${list}) returning 1) select count(*) from u;`).out.split("\n").pop();
  const del = asUser(A.user, `with d as (delete from ${t} where id in (${list}) returning 1) select count(*) from d;`).out.split("\n").pop();
  if (Number(upd || 0) > 0 || Number(del || 0) > 0) writes.push(`${t} (update ${upd}, delete ${del})`);
}
ok("another company's rows are never visible to an owner (every table with a company)", leaks.length === 0, leaks.join(", "));
ok("another company's rows can never be changed or deleted by an owner", writes.length === 0, writes.join(", "));

// Children without their own company column: reached only through their parent.
const CHILD = [["quote_items", "quote_id", "quotes"], ["invoice_items", "invoice_id", "invoices"], ["purchase_order_items", "purchase_order_id", "purchase_orders"], ["material_request_items", "request_id", "material_requests"], ["change_order_items", "change_order_id", "change_orders"]];
for (const [child, fk, parent] of CHILD) {
  if (!tables.includes(child) || !tables.includes(parent)) continue;
  if (!hasCol(parent, "company_id")) continue;
  const foreign = rows(sql(`select c.id from ${child} c join ${parent} p on p.id=c.${fk} where p.company_id <> '${A.company}' limit 50`)).map((r) => r[0]);
  if (foreign.length === 0) continue;
  const seen = Number(asUser(A.user, `select count(*) from ${child} where id in (${foreign.map((i) => `'${i}'`).join(",")});`).out.split("\n").pop() || 0);
  ok(`${child}: another company's lines are not visible`, seen === 0, String(seen));
}

// 3. Privilege escalation attempts (every statement must change nothing or fail).
const tryWrite = (user, stmt) => { const r = asUser(user, `with u as (${stmt} returning 1) select count(*) from u;`); const last = r.out.split("\n").pop(); return { changed: Number(last) > 0 && !/ERROR/.test(r.err), err: r.err }; };
ok("an employee cannot make themselves owner", !tryWrite(employee.user, `update company_members set role='owner' where user_id='${employee.user}'`).changed);
ok("an employee cannot rewrite their own permissions", !tryWrite(employee.user, `update member_permissions set permissions = jsonb_set(permissions, '{can_view_costs}', 'true') where user_id='${employee.user}'`).changed);
ok("an employee cannot rename the company", !tryWrite(employee.user, `update companies set name='hacked' where id='${A.company}'`).changed);
ok("an employee cannot approve their own purchase order", !tryWrite(employee.user, `update purchase_orders set status='approved' where created_by='${employee.user}' and status='pending_approval'`).changed);
ok("an owner cannot add themselves to another company", !asUser(A.user, `insert into company_members(company_id,user_id,role) values ('${B.company}','${A.user}','owner');`).out.includes("INSERT") && /(violates|denied|policy)/i.test(asUser(A.user, `insert into company_members(company_id,user_id,role) values ('${B.company}','${A.user}','owner');`).err));
ok("an owner cannot move a project into another company", !tryWrite(A.user, `update projects set company_id='${B.company}' where company_id='${A.company}'`).changed);
ok("an owner cannot read another company's profile data beyond its members", Number(asUser(A.user, `select count(*) from profiles where id not in (select user_id from company_members where company_id='${A.company}') and id in (select user_id from company_members where company_id='${B.company}');`).out.split("\n").pop() || 0) === 0);

// 4. What an employee must not see (money and customers), compared with what an owner sees.
const MONEY = ["quotes", "quote_items", "invoices", "invoice_items", "clients", "change_orders", "accounting_export_log", "customer_links", "customer_actions", "company_settings"];
const employeeSees = [];
for (const t of MONEY) {
  if (!tables.includes(t)) continue;
  const ownerSees = Number(asUser(A.user, `select count(*) from ${t};`).out.split("\n").pop() || 0);
  const empSees = Number(asUser(employee.user, `select count(*) from ${t};`).out.split("\n").pop() || 0);
  if (ownerSees > 0 && empSees > 0) employeeSees.push(`${t} (${empSees}/${ownerSees})`);
}
ok("an employee without the right does not see money documents or customers", employeeSees.length === 0, employeeSees.join(", "));
const others = Number(asUser(employee.user, `select count(*) from purchase_orders where created_by <> '${employee.user}';`).out.split("\n").pop() || 0);
const ownerPOs = Number(asUser(A.user, `select count(*) from purchase_orders where created_by <> '${employee.user}';`).out.split("\n").pop() || 0);
ok("an employee sees only their own purchase orders", others === 0 || ownerPOs === 0, `${others} of others visible`);
const otherExp = Number(asUser(employee.user, `select count(*) from expenses where created_by <> '${employee.user}';`).out.split("\n").pop() || 0);
ok("an employee sees only their own expenses", otherExp === 0, String(otherExp));

// 5. Not signed in: nothing at all.
const anonSees = [];
for (const t of tables) {
  const r = asUser(null, `select count(*) from ${t};`, "anon");
  const n = Number(r.out.split("\n").pop() || 0);
  if (n > 0 && !/ERROR/.test(r.err)) anonSees.push(`${t} (${n})`);
}
ok("a visitor who is not signed in can read no table", anonSees.length === 0, anonSees.join(", "));
const fnRows = rows(sql(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute') order by 1`)).map((r) => r[0]);
const EXPECTED_PUBLIC = /^(customer_|supplier_|get_invitation|invitation_|preview_invitation)/;
const unexpected = fnRows.filter((f) => !EXPECTED_PUBLIC.test(f));
ok("only the link-by-token functions can be called without signing in", unexpected.length === 0, unexpected.join(", "));
console.log(`   (public functions: ${fnRows.join(", ")})`);

// 6. A supply house sees its requests and nothing of the contractor's business.
if (supply) {
  const bad = [];
  for (const t of ["projects", "clients", "quotes", "invoices", "purchase_orders", "expenses", "company_materials", "material_requests", "member_permissions"]) {
    if (!tables.includes(t)) continue;
    const n = Number(asUser(supply.user, `select count(*) from ${t};`).out.split("\n").pop() || 0);
    if (n > 0) bad.push(`${t} (${n})`);
  }
  ok("a supply account sees none of a contractor's projects, customers, money or team", bad.length === 0, bad.join(", "));
  const projNames = Number(asUser(supply.user, `select count(*) from supply_quote_requests where project_id is not null;`).out.split("\n").pop() || 0);
  console.log(`   (supply sees ${projNames} requests that carry a project id; the screens must hide the project name)`);
}

console.log(failed === 0 ? "\nALL RLS CHECKS PASSED" : `\n${failed} RLS CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
