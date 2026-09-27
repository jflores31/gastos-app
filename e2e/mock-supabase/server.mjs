// Minimal stand-in for a Supabase project (Auth + PostgREST), for the e2e tests behind the
// login. No dependencies: `node e2e/mock-supabase/server.mjs`.
//
// - Tables and columns come from supabase/migrations/*.sql, so writing a column the real
//   schema doesn't have fails here too (PGRST204), as it would in production.
// - Every row is scoped to the user in the JWT, like the RLS policies.
// - Each user starts with the dataset in seed.mjs; use a distinct email per test to isolate.
// - Test helpers: GET /__mock/health, GET /__mock/db?email=… (that user's rows).
import http from "node:http"
import { randomUUID } from "node:crypto"
import { loadSchema } from "./schema.mjs"
import { seedFor } from "./seed.mjs"

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54321)
const schema = loadSchema()

const users = new Map() // email → user
const db = new Map() // user id → { [table]: rows[] }

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url")
const decodeJwt = (token) => {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) } catch { return null }
}

function userFor(email) {
  if (!users.has(email)) {
    const id = randomUUID()
    const now = new Date().toISOString()
    users.set(email, {
      id, aud: "authenticated", role: "authenticated", email,
      email_confirmed_at: now, confirmed_at: now, last_sign_in_at: now, created_at: now, updated_at: now,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { full_name: email.split("@")[0] },
      identities: [],
    })
    db.set(id, seedFor(id, schema))
  }
  return users.get(email)
}

function session(user) {
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 3600
  const header = b64url({ alg: "HS256", typ: "JWT" })
  const payload = b64url({ sub: user.id, email: user.email, aud: "authenticated", role: "authenticated", iat: now, exp: now + expiresIn, session_id: randomUUID() })
  return {
    access_token: `${header}.${payload}.mock-signature`,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    refresh_token: `${user.email}|${randomUUID()}`,
    user,
  }
}

function userFromRequest(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer /i, "")
  const claims = decodeJwt(token)
  if (!claims?.sub || claims.exp * 1000 < Date.now()) return null
  return [...users.values()].find((u) => u.id === claims.sub) ?? null
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers })
  res.end(body === undefined ? "" : JSON.stringify(body))
}
const authError = (res, status, code, msg) => send(res, status, { code: status, error_code: code, msg, error: code, error_description: msg })
const pgError = (res, status, code, message) => send(res, status, { code, message, details: null, hint: null })

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString()
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function handleAuth(req, res, url) {
  const route = url.pathname.replace("/auth/v1", "")
  if (route === "/token" && req.method === "POST") {
    const body = await readBody(req)
    const grant = url.searchParams.get("grant_type")
    if (grant === "password") {
      if (!body.email || body.password === "wrong-password") return authError(res, 400, "invalid_credentials", "Invalid login credentials")
      return send(res, 200, session(userFor(String(body.email).toLowerCase())))
    }
    if (grant === "refresh_token") {
      const email = String(body.refresh_token ?? "").split("|")[0]
      if (!users.has(email)) return authError(res, 400, "refresh_token_not_found", "Invalid Refresh Token")
      return send(res, 200, session(users.get(email)))
    }
    return authError(res, 400, "unsupported_grant_type", "Unsupported grant type")
  }
  if (route === "/user") {
    const user = userFromRequest(req)
    if (!user) return authError(res, 401, "bad_jwt", "invalid JWT")
    if (req.method === "PUT") {
      const body = await readBody(req)
      if (body.data) user.user_metadata = { ...user.user_metadata, ...body.data }
      user.updated_at = new Date().toISOString()
    }
    return send(res, 200, user)
  }
  if (route === "/logout") return send(res, 204)
  if (route === "/signup" && req.method === "POST") {
    const body = await readBody(req)
    const user = userFor(String(body.email).toLowerCase())
    return send(res, 200, { ...user, email_confirmed_at: null, confirmation_sent_at: new Date().toISOString() })
  }
  if (route === "/recover") return send(res, 200, {})
  if (route === "/settings") return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: false })
  return authError(res, 404, "not_found", `mock: ${req.method} ${route} not implemented`)
}

// ── PostgREST ─────────────────────────────────────────────────────────────────
const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"])

function filtersOf(url) {
  const out = []
  for (const [col, expr] of url.searchParams) {
    if (RESERVED.has(col)) continue
    const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|is|in)\.(.*)$/.exec(expr)
    if (m) out.push([col, m[2], m[3], !!m[1]])
  }
  return out
}

function matches(row, [col, op, raw, negate]) {
  return negate ? !matchesOp(row[col], op, raw) : matchesOp(row[col], op, raw)
}

function matchesOp(v, op, raw) {
  switch (op) {
    case "eq": return String(v) === raw
    case "neq": return String(v) !== raw
    case "gt": return v > coerceLike(v, raw)
    case "gte": return v >= coerceLike(v, raw)
    case "lt": return v < coerceLike(v, raw)
    case "lte": return v <= coerceLike(v, raw)
    case "is": return raw === "null" ? v == null : String(v) === raw
    case "in": return raw.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(v))
    default: return true
  }
}
const coerceLike = (sample, raw) => (typeof sample === "number" ? Number(raw) : raw)

function sortRows(rows, order) {
  if (!order) return rows
  const keys = order.split(",").map((part) => {
    const [col, dir = "asc"] = part.split(".")
    return [col, dir === "desc" ? -1 : 1]
  })
  return [...rows].sort((a, b) => {
    for (const [col, dir] of keys) {
      if (a[col] === b[col]) continue
      if (a[col] == null) return 1
      if (b[col] == null) return -1
      return (a[col] < b[col] ? -1 : 1) * dir
    }
    return 0
  })
}

// Validates and normalises one row for `table`; returns [row, null] or [null, error].
function prepareRow(table, input, userId, { partial = false } = {}) {
  const cols = schema[table]
  const row = {}
  for (const [key, value] of Object.entries(input)) {
    const col = cols[key]
    if (!col) return [null, [400, "PGRST204", `Could not find the '${key}' column of '${table}' in the schema cache`]]
    row[key] = coerce(col.type, value)
  }
  if (!partial) {
    for (const [name, col] of Object.entries(cols)) {
      if (row[name] === undefined && col.default !== undefined) row[name] = typeof col.default === "function" ? col.default() : col.default
      if (row[name] === undefined) row[name] = null
      if (col.notNull && row[name] == null) return [null, [400, "23502", `null value in column "${name}" of relation "${table}" violates not-null constraint`]]
    }
    if (row.user_id !== userId) return [null, [403, "42501", `new row violates row-level security policy for table "${table}"`]]
  }
  for (const [name, value] of Object.entries(row)) {
    const { check: allowed, positive } = cols[name]
    if ((allowed && value != null && !allowed.includes(value)) || (positive && value != null && !(value > 0))) {
      return [null, [400, "23514", `new row for relation "${table}" violates check constraint "${table}_${name}_check"`]]
    }
  }
  if (partial && "user_id" in row && row.user_id !== userId) return [null, [403, "42501", `new row violates row-level security policy for table "${table}"`]]
  // Foreign keys (col, user_id) → (id, user_id): the row must exist and be the user's.
  for (const [name, value] of Object.entries(row)) {
    const ref = cols[name].references
    if (ref && value != null && !db.get(userId)?.[ref]?.some((r) => r.id === value)) {
      return [null, [409, "23503", `insert or update on table "${table}" violates foreign key constraint "${table}_${name}_fkey"`]]
    }
  }
  return [row, null]
}

function coerce(type, value) {
  if (value == null) return null
  if (/^(decimal|numeric|int|integer|bigint|real|double)/.test(type)) return Number(value)
  if (type === "boolean") return Boolean(value)
  if (type === "date") return String(value).slice(0, 10)
  if (type === "timestamptz") return new Date(value).toISOString()
  return value
}

async function handleRest(req, res, url) {
  const table = url.pathname.replace("/rest/v1/", "")
  if (!schema[table]) return pgError(res, 404, "PGRST205", `Could not find the table 'public.${table}' in the schema cache`)
  const user = userFromRequest(req)
  if (!user) return pgError(res, 401, "PGRST301", "JWT expired or missing")

  const tables = db.get(user.id)
  const all = tables[table]
  const filters = filtersOf(url)
  const selected = () => all.filter((r) => filters.every((f) => matches(r, f)))
  const prefer = req.headers.prefer ?? ""
  const single = (req.headers.accept ?? "").includes("application/vnd.pgrst.object+json")
  const returning = prefer.includes("return=representation")

  const reply = (rows, status = 200) => {
    if (single) {
      if (rows.length !== 1) return pgError(res, 406, "PGRST116", `JSON object requested, multiple (or no) rows returned`)
      return send(res, status, rows[0])
    }
    const end = rows.length ? rows.length - 1 : 0
    return send(res, status, rows, { "content-range": rows.length ? `0-${end}/*` : "*/*" })
  }

  if (req.method === "GET" || req.method === "HEAD") {
    let rows = sortRows(selected(), url.searchParams.get("order"))
    const offset = Number(url.searchParams.get("offset") ?? 0)
    const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : Infinity
    rows = rows.slice(offset, offset + limit)
    return reply(rows)
  }

  if (req.method === "POST") {
    const body = await readBody(req)
    const inputs = Array.isArray(body) ? body : [body]
    const upsert = prefer.includes("resolution=merge-duplicates")
    const conflictCols = (url.searchParams.get("on_conflict") ?? "id").split(",")
    const written = []
    for (const input of inputs) {
      const [row, err] = prepareRow(table, input, user.id)
      if (err) return pgError(res, ...err)
      const existing = upsert && all.find((r) => conflictCols.every((c) => String(r[c]) === String(row[c])))
      if (existing) {
        for (const k of Object.keys(input)) existing[k] = row[k]
        written.push(existing)
      } else {
        all.push(row)
        written.push(row)
      }
    }
    return returning ? reply(written, 201) : send(res, 201)
  }

  if (req.method === "PATCH") {
    const body = await readBody(req)
    const [patch, err] = prepareRow(table, body, user.id, { partial: true })
    if (err) return pgError(res, ...err)
    const rows = selected()
    rows.forEach((r) => Object.assign(r, patch))
    return returning ? reply(rows) : send(res, 204)
  }

  if (req.method === "DELETE") {
    const rows = selected()
    tables[table] = all.filter((r) => !rows.includes(r))
    // ON DELETE SET NULL: e.g. a deleted account leaves its transactions without one.
    const ids = new Set(rows.map((r) => r.id))
    for (const [other, cols] of Object.entries(schema)) {
      for (const [name, col] of Object.entries(cols)) {
        if (col.references === table) for (const r of tables[other]) if (ids.has(r[name])) r[name] = null
      }
    }
    return returning ? reply(rows) : send(res, 204)
  }

  return pgError(res, 405, "PGRST000", `mock: ${req.method} not supported`)
}

// Stand-in for open.er-api.com (RATES_API_URL in playwright.config.ts): today's rates as
// units per 1 PEN. USD differs from the fixed 0.27 so the tests can tell which were used.
const MOCK_RATES = {
  result: "success", base_code: "PEN", time_last_update_unix: 1790467201, // 2026-09-27
  rates: { PEN: 1, USD: 0.26, EUR: 0.25, MXN: 5, COP: 1100, ARS: 320, CLP: 250, BRL: 1.5 },
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", req.headers.origin ?? "*")
  res.setHeader("access-control-allow-credentials", "true")
  res.setHeader("access-control-allow-methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD")
  res.setHeader("access-control-allow-headers", req.headers["access-control-request-headers"] ?? "*")
  res.setHeader("access-control-expose-headers", "content-range, x-supabase-api-version")
  if (req.method === "OPTIONS") return send(res, 204)

  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname === "/__mock/health") return send(res, 200, { ok: true })
    if (url.pathname === "/__mock/rates") return send(res, 200, MOCK_RATES)
    if (url.pathname === "/__mock/db") {
      const user = users.get(String(url.searchParams.get("email")).toLowerCase())
      return user ? send(res, 200, { user, tables: db.get(user.id) }) : send(res, 404, { error: "unknown user" })
    }
    if (url.pathname.startsWith("/auth/v1/")) return await handleAuth(req, res, url)
    if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url)
    return send(res, 404, { error: `mock: ${url.pathname} not found` })
  } catch (e) {
    console.error("[mock-supabase]", e)
    return send(res, 500, { message: String(e) })
  }
})

server.listen(PORT, "127.0.0.1", () => console.log(`[mock-supabase] http://127.0.0.1:${PORT}`))
