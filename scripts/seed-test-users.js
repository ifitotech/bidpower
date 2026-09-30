#!/usr/bin/env node
// Creates confirmed TEST accounts (no real email needed) so the app can be reviewed without registering by hand.
// Run it on YOUR machine or in a trusted shell; the service_role key is read from the environment and never stored:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TEST_USER_PASSWORD='...' node scripts/seed-test-users.js --yes
// The company is created by the app itself on the first login (from the user metadata), exactly like a normal sign-up.
// This is a script, not an app feature: there is no bypass inside the product.
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const password = process.env.TEST_USER_PASSWORD || "";
if (!process.argv.includes("--yes")) { console.error("Add --yes to confirm you want to create test accounts in " + (url || "(no URL)")); process.exit(1); }
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment."); process.exit(1); }
if (password.length < 12) { console.error("Set TEST_USER_PASSWORD (at least 12 characters)."); process.exit(1); }

const USERS = [
  { email: "owner@prueba.test", full_name: "Owner Prueba", company_name: "Empresa Prueba", account_kind: "contractor" },
  { email: "supply@prueba.test", full_name: "Supply Prueba", company_name: "Supply Prueba", account_kind: "supply" },
];

(async () => {
  for (const u of USERS) {
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: u.email, password, email_confirm: true, user_metadata: { full_name: u.full_name, company_name: u.company_name, phone: "", account_kind: u.account_kind } }),
    });
    if (res.ok) console.log(`created  ${u.email}`);
    else if (res.status === 422) console.log(`exists   ${u.email}`);
    else console.log(`failed   ${u.email} (${res.status})`);
  }
  console.log("Sign in at /login. Employees and Managers are invited from the Owner (Employees → Invite).");
})();
