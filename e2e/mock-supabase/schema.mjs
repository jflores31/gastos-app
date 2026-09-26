// Reads the tables and columns from supabase/migrations/*.sql (schema.sql first), so the
// mock rejects the same unknown columns the real database would.
import { readFileSync, readdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import path from "node:path"

const MIGRATIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations")
const NOT_COLUMNS = /^(UNIQUE|PRIMARY|CHECK|CONSTRAINT|FOREIGN)\b/i

function parseDefault(sql) {
  const m = /DEFAULT\s+('(?:[^']|'')*'|[\w.]+\(\)|-?\d+(?:\.\d+)?|true|false)/i.exec(sql)
  if (!m) return undefined
  const v = m[1]
  if (/^gen_random_uuid\(\)$/i.test(v)) return () => randomUUID()
  if (/^now\(\)$/i.test(v)) return () => new Date().toISOString()
  if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'")
  if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true"
  return Number(v)
}

function parseColumn(line) {
  const m = /^\s*(\w+)\s+([a-z]+)(?:\([\d,\s]+\))?(.*)$/i.exec(line.replace(/,\s*$/, ""))
  if (!m || NOT_COLUMNS.test(m[1])) return null
  const [, name, type, rest] = m
  const check = /CHECK\s*\(\s*\w+\s+IN\s*\(([^)]*)\)\s*\)/i.exec(rest)
  return [name, {
    type: type.toLowerCase(),
    notNull: /NOT NULL/i.test(rest) || /PRIMARY KEY/i.test(rest),
    default: parseDefault(rest),
    check: check ? check[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")) : undefined,
  }]
}

export function loadSchema() {
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"))
    .sort((a, b) => (a === "schema.sql" ? -1 : b === "schema.sql" ? 1 : a.localeCompare(b)))
  const tables = {}
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS, file), "utf8").replace(/--.*$/gm, "")
    for (const [, table, body] of sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\n\);/gi)) {
      tables[table] ??= {}
      for (const line of body.split("\n")) {
        const col = parseColumn(line)
        if (col) tables[table][col[0]] ??= col[1]
      }
    }
    for (const [, table, def] of sql.matchAll(/ALTER TABLE (?:IF EXISTS )?(\w+)\s+ADD COLUMN IF NOT EXISTS ([^;]+);/gi)) {
      const col = parseColumn(def)
      if (col && tables[table]) tables[table][col[0]] ??= col[1]
    }
  }
  return tables
}
