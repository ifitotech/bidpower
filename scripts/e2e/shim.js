// GoTrue + Storage stand-in for the local e2e harness. Signs real HS256 JWTs (so PostgREST/RLS behave as in
// production), keeps users in auth.users, proxies /rest/v1 to PostgREST and serves /storage/v1 from memory.
const http = require("http");
const crypto = require("crypto");
const nodePath = process.env.E2E_NODE_PATH || "/opt/e2e-node/node_modules";
const jwt = require(nodePath + "/jsonwebtoken");
const { Pool } = require(nodePath + "/pg");

const SECRET = process.env.JWT_SECRET || "e2e-secret-e2e-secret-e2e-secret-123456";
const PGREST = process.env.PGREST_URL || "http://127.0.0.1:54331";
const pool = new Pool({ connectionString: process.env.DB_URL || "postgres://shim:shim-pass@127.0.0.1:5432/e2e" });
const users = new Map(); // id -> {id,email,password,meta}
const refresh = new Map(); // token -> user id
const files = new Map(); // "bucket/path" -> {buf, type}
const uid = () => crypto.randomUUID();

const pub = (u) => ({ id: u.id, email: u.email, aud: "authenticated", role: "authenticated", user_metadata: u.meta, app_metadata: { provider: "email" }, identities: [{ id: u.id }], created_at: new Date().toISOString() });
function session(u) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access = jwt.sign({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", exp }, SECRET);
  const r = "r" + crypto.randomBytes(12).toString("hex");
  refresh.set(r, u.id);
  return { access_token: access, refresh_token: r, token_type: "bearer", expires_in: 3600, expires_at: exp, user: pub(u) };
}
const userFromToken = (h) => { try { const p = jwt.verify((h || "").replace("Bearer ", ""), SECRET); return users.get(p.sub) || null; } catch { return null; } };

function readBody(req) { return new Promise((res) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => res(Buffer.concat(c))); }); }

http.createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "*");
  res.setHeader("access-control-allow-methods", "*");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  const send = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  const body = await readBody(req);

  if (p.startsWith("/rest/v1/")) {
    const headers = { ...req.headers, host: "127.0.0.1:54331" };
    delete headers["content-length"];
    const target = new URL(PGREST + p.slice("/rest/v1".length) + url.search);
    const pr = http.request(target, { method: req.method, headers: { ...headers, "content-length": body.length } }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    pr.on("error", (e) => send(502, { message: e.message }));
    pr.end(body);
    return;
  }

  let j = {};
  try { j = body.length ? JSON.parse(body.toString()) : {}; } catch {}

  if (p === "/auth/v1/signup") {
    if ([...users.values()].some((u) => u.email === (j.email || "").toLowerCase())) return send(422, { msg: "User already registered", code: 422 });
    const u = { id: uid(), email: String(j.email).toLowerCase(), password: j.password, meta: j.data || {} };
    users.set(u.id, u);
    await pool.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)", [u.id, u.email, u.meta]);
    return send(200, session(u));
  }
  if (p === "/auth/v1/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "refresh_token") { const id = refresh.get(j.refresh_token); const u = id && users.get(id); return u ? send(200, session(u)) : send(400, { error: "invalid_grant", msg: "Invalid Refresh Token" }); }
    const u = [...users.values()].find((x) => x.email === String(j.email || "").toLowerCase() && x.password === j.password);
    return u ? send(200, session(u)) : send(400, { error: "invalid_grant", error_description: "Invalid login credentials", code: 400, msg: "Invalid login credentials" });
  }
  if (p === "/auth/v1/user") { const u = userFromToken(req.headers.authorization); return u ? send(200, pub(u)) : send(401, { msg: "invalid JWT" }); }
  if (p === "/auth/v1/logout") { res.writeHead(204); return res.end(); }

  // ---- storage ----
  const m = p.match(/^\/storage\/v1\/object\/(?:(sign|authenticated|public)\/)?([^/]+)\/(.+)$/);
  if (m) {
    const [, mode, bucket, path] = m;
    const key = `${bucket}/${decodeURIComponent(path)}`;
    if (req.method === "POST" && mode === "sign") return send(200, { signedURL: `/object/sign/${bucket}/${path}?token=e2e` });
    if ((req.method === "POST" || req.method === "PUT") && !mode) {
      if (!userFromToken(req.headers.authorization)) return send(401, { message: "unauthorized" });
      // multipart form-data: keep the raw body as the file (good enough for the tests)
      files.set(key, { buf: body, type: req.headers["content-type"] || "application/octet-stream" });
      return send(200, { Key: key, Id: uid() });
    }
    if (req.method === "GET") { const f = files.get(key); if (!f) return send(404, { message: "not found" }); res.writeHead(200, { "content-type": f.type }); return res.end(f.buf); }
  }
  if (req.method === "DELETE" && /^\/storage\/v1\/object\/[^/]+$/.test(p)) { const b = p.split("/").pop(); for (const x of j.prefixes || []) files.delete(`${b}/${x}`); return send(200, []); }
  return send(404, { message: "not found", path: p });
}).listen(54321, () => console.log("shim on 54321"));
