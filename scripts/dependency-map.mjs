// Dependency map of src/: who imports whom, import cycles, violations of the layer rules
// (docs/PROJECT-STRUCTURE.md) and exports nobody imports. No dependencies: it reads the
// import statements with a regular expression, which is enough for this codebase's style.
//
//   node scripts/dependency-map.mjs            summary: areas, cycles, violations
//   node scripts/dependency-map.mjs --areas    area → area dependency table (markdown)
//   node scripts/dependency-map.mjs --unused   exports with no consumer (or only tests)
//
// src/architecture.test.js runs the same checks in `npm test`.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC = path.join(ROOT, "src")
const EXTS = [".ts", ".tsx", ".js", ".jsx"]

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = path.join(dir, name)
  if (statSync(p).isDirectory()) return walk(p)
  return EXTS.includes(path.extname(p)) ? [p] : []
})

export const isTest = (file) => /\.test\.[jt]sx?$/.test(file)
export const rel = (file) => path.relative(SRC, file).split(path.sep).join("/")

const IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?([\s\S]*?)\s*from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|vi\.mock\(\s*["']([^"']+)["']/g

function resolve(from, spec) {
  let base
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec)
  else return null
  for (const c of [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => path.join(base, "index" + e))]) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return undefined // unresolved
}

// Names a clause like `{ a, b as c }`, `X`, `X, { a }` or `* as ns` imports.
function importedNames(clause) {
  if (!clause) return ["*"]
  const names = []
  const braces = clause.match(/\{([\s\S]*)\}/)
  if (braces) for (const part of braces[1].split(",")) {
    const n = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim()
    if (n) names.push(n)
  }
  const outside = clause.replace(/\{[\s\S]*\}/, "").replace(/^type\s+/, "").split(",").map((s) => s.trim()).filter(Boolean)
  for (const o of outside) names.push(o.startsWith("*") ? "*" : "default")
  return names
}

export function buildGraph() {
  const files = walk(SRC)
  const nodes = new Map() // file → { imports: [{ spec, file, names }], packages: Set, exports: Set }
  for (const file of files) {
    const text = readFileSync(file, "utf8")
    const node = { imports: [], packages: new Set(), exports: new Set() }
    for (const m of text.matchAll(IMPORT)) {
      const spec = m[2] ?? m[3] ?? m[4] ?? m[5]
      const target = resolve(file, spec)
      if (target === null) node.packages.add(spec)
      else node.imports.push({ spec, file: target, names: m[5] ? ["*"] : importedNames(m[1]), unresolved: target === undefined })
    }
    for (const m of text.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) node.exports.add(m[1])
    for (const m of text.matchAll(/export\s+default\b/g)) node.exports.add("default")
    for (const m of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
      for (const part of m[1].split(",")) { const n = part.trim().split(/\s+as\s+/).pop()?.trim(); if (n) node.exports.add(n) }
    }
    nodes.set(file, node)
  }
  return nodes
}

// The folder a file belongs to, for the layer rules: "features/<name>/<kind>", or a top-level
// folder of src/ ("components", "lib/supabase", "domain"…).
export function area(file) {
  const r = rel(file)
  const parts = r.split("/")
  if (parts[0] === "features") return parts.length > 3 ? `features/${parts[1]}/${parts[2]}` : `features/${parts[1]}`
  if (parts[0] === "lib" && (parts[1] === "supabase" || /^supabase(-server)?\.ts$/.test(parts[1]))) return "lib/supabase"
  if (parts.length === 1) return r.replace(/\.[jt]sx?$/, "")
  if (parts[0] === "app" && parts[1] === "auth") return "app/auth"
  return parts[0]
}

const feature = (a) => (a.startsWith("features/") ? a.split("/")[1] : null)
const kind = (a) => (a.startsWith("features/") ? a.split("/")[2] ?? "" : null)
const isDomain = (a) => a === "domain" || kind(a) === "domain" || a === "types"
const COMPOSERS = new Set(["dashboard", "settings"]) // screens that put several features together
// Feature screens still waiting to move out of components/ during the refactor (phase 3).
// They are not shared components yet, so the "components never import features" rule
// skips them. Remove this list when phase 3 ends: nothing should match it by then.
const LEGACY = /^components\/([^/]+\.jsx|budget\/|goals\/|settings\/)/
const SUPABASE_OK = (a) => a === "lib/supabase" || kind(a) === "data" || a === "contexts" || a === "context" || a === "proxy" || a === "app/auth"

// Each rule: (fromArea, toArea | package) → message when broken.
export function violations(nodes) {
  const out = []
  for (const [file, node] of nodes) {
    if (isTest(file)) continue
    const from = area(file)
    const add = (msg) => out.push(`${rel(file)}: ${msg}`)
    for (const pkg of node.packages) {
      if (pkg.startsWith("@supabase/") && !SUPABASE_OK(from)) add(`imports ${pkg} (Supabase belongs in features/*/data or lib/supabase)`)
      if (isDomain(from) && (pkg === "react" || pkg.startsWith("@mui/"))) add(`domain code imports ${pkg}`)
    }
    for (const imp of node.imports) {
      if (imp.unresolved) { add(`unresolved import ${imp.spec}`); continue }
      const to = area(imp.file)
      if (to === "lib/supabase" && !SUPABASE_OK(from)) add(`imports ${rel(imp.file)} (Supabase belongs in features/*/data or lib/supabase)`)
      if (from === "components" && !LEGACY.test(rel(file)) && to.startsWith("features/")) add(`shared components import a feature (${rel(imp.file)})`)
      if (["lib", "lib/supabase", "domain", "types", "theme", "i18n"].includes(from) && /^(features|components|contexts|context|hooks)/.test(to)) {
        add(`${from} imports ${to} (${rel(imp.file)})`)
      }
      if (isDomain(from) && /^(contexts|context|components|lib\/supabase)$|^features\/[^/]+\/(components|hooks|data)$/.test(to)) {
        add(`domain code imports ${to} (${rel(imp.file)})`)
      }
      const fa = feature(from), fb = feature(to)
      if (fa && fb && fa !== fb && !COMPOSERS.has(fa) && /^(components|hooks)$/.test(kind(to))) {
        add(`feature ${fa} imports ${fb}'s ${kind(to)} (${rel(imp.file)})`)
      }
    }
  }
  return out
}

// Import cycles between source files (tests excluded), as lists of files.
export function cycles(nodes) {
  const index = new Map(), low = new Map(), stack = [], onStack = new Set(), found = []
  let i = 0
  const visit = (v) => {
    index.set(v, i); low.set(v, i); i++; stack.push(v); onStack.add(v)
    for (const { file: w, unresolved } of nodes.get(v).imports) {
      if (unresolved || isTest(w) || !nodes.has(w)) continue
      if (!index.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))) } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)))
    }
    if (low.get(v) === index.get(v)) {
      const comp = []
      let w
      do { w = stack.pop(); onStack.delete(w); comp.push(rel(w)) } while (w !== v)
      if (comp.length > 1) found.push(comp)
    }
  }
  for (const v of nodes.keys()) if (!isTest(v) && !index.has(v)) visit(v)
  return found
}

// Exports nobody imports, and those only tests import. Next's route/page/layout exports and
// config files are consumed by the framework, not by imports.
const FRAMEWORK = /^(app\/.*\/(page|layout|route|error|global-error|not-found)|app\/(page|layout|error|global-error|not-found|manifest)|proxy)\.[jt]sx?$/
export function unusedExports(nodes) {
  const used = new Map() // file → Map(name → { src: bool, test: bool })
  for (const [file, node] of nodes) for (const imp of node.imports) {
    if (imp.unresolved) continue
    const m = used.get(imp.file) ?? new Map()
    for (const n of imp.names) { const u = m.get(n) ?? { src: false, test: false }; u[isTest(file) ? "test" : "src"] = true; m.set(n, u) }
    used.set(imp.file, m)
  }
  const unused = [], internal = [], testOnly = []
  for (const [file, node] of nodes) {
    if (isTest(file) || FRAMEWORK.test(rel(file))) continue
    const m = used.get(file) ?? new Map()
    if (m.has("*")) continue
    const text = readFileSync(file, "utf8")
    for (const name of node.exports) {
      const u = m.get(name)
      const inFile = name !== "default" && (text.match(new RegExp(`\\b${name.replace("$", "\\$")}\\b`, "g")) ?? []).length > 1
      if (!u) (inFile ? internal : unused).push(`${rel(file)}: ${name}`)
      else if (!u.src) testOnly.push(`${rel(file)}: ${name}`)
    }
  }
  return { unused, internal, testOnly }
}

// area → areas it imports, for the dependency map in the docs.
export function areaMap(nodes) {
  const map = new Map()
  for (const [file, node] of nodes) {
    if (isTest(file)) continue
    const from = area(file)
    const set = map.get(from) ?? new Set()
    for (const imp of node.imports) if (!imp.unresolved && area(imp.file) !== from) set.add(area(imp.file))
    for (const pkg of node.packages) if (pkg.startsWith("@supabase/")) set.add(pkg)
    map.set(from, set)
  }
  return new Map([...map].sort(([a], [b]) => a.localeCompare(b)))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const nodes = buildGraph()
  const arg = process.argv[2]
  if (arg === "--areas") {
    console.log("| Área | Importa |\n|---|---|")
    for (const [a, deps] of areaMap(nodes)) console.log(`| \`${a}\` | ${[...deps].sort().map((d) => `\`${d}\``).join(", ") || "—"} |`)
  } else if (arg === "--unused") {
    const { unused, internal, testOnly } = unusedExports(nodes)
    const list = (title, xs) => console.log(`${title} (${xs.length}):${xs.map((u) => "\n  " + u).join("")}`)
    list("Sin uso en ningún lado", unused)
    list("Exportados pero usados solo en su archivo", internal)
    list("Solo los usan tests", testOnly)
  } else {
    const files = [...nodes.keys()]
    const cyc = cycles(nodes), bad = violations(nodes)
    console.log(`${files.filter((f) => !isTest(f)).length} source files, ${files.filter(isTest).length} test files`)
    console.log(`cycles: ${cyc.length}${cyc.map((c) => "\n  " + c.join(" → ")).join("")}`)
    console.log(`layer violations: ${bad.length}${bad.map((b) => "\n  " + b).join("")}`)
    process.exitCode = cyc.length ? 1 : 0
  }
}
