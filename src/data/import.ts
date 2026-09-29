import { CATEGORIES, CURRENCIES, currencyOf, toBase } from "./index"
import { normalizeConcept, suggestCategory } from "./suggest"
import type { Transaction, TxType } from "@/types/domain"

// CSV import: the app's own export (src/data/export.ts) or a bank/spreadsheet file whose
// columns the user maps. Pure functions; the dialog (ImportDialog) reads the file and
// DataContext.addTxs() saves the result.

export const MAX_IMPORT_ROWS = 10_000
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export type CsvTable = { header: string[]; rows: string[][] }

// RFC 4180: quoted fields with "" escapes and line breaks, CRLF or LF, an optional BOM.
// The delimiter is ";" when the header has more of them than commas (Excel in Spanish).
export function parseCsv(text: string): CsvTable {
  const src = text.replace(/^\uFEFF/, "")
  const firstLine = src.slice(0, src.search(/\r?\n|$/))
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
  const records: string[][] = []
  let field = ""
  let record: string[] = []
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"' && field === "") quoted = true
    else if (c === delim) { record.push(field); field = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      record.push(field); records.push(record); record = []; field = ""
    } else field += c
  }
  if (field !== "" || record.length) { record.push(field); records.push(record) }
  const nonEmpty = records.filter((r) => r.some((f) => f.trim() !== ""))
  const [header = [], ...rows] = nonEmpty
  return { header: header.map((h) => h.trim()), rows }
}

// The export prefixes a ' to cells that Excel would run as a formula: undo it.
export const unguardCell = (s: string) => (/^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s)

export type ColumnMap = {
  fecha: number; concepto: number; monto: number; tipo?: number; categoria?: number
  // Only in the app's own export: the currency each one was entered in, and its account.
  moneda?: number; montoOriginal?: number; tasa?: number; cuenta?: number
}

export const APP_EXPORT_HEADER = ["fecha", "tipo", "categoria", "categoria_nombre", "concepto", "monto_pen"]
// Added after the first version of the export, so they are optional.
const APP_EXPORT_CURRENCY = ["moneda", "monto_original", "tasa"]

// The app's own export: amounts are already in PEN.
export function detectAppFormat(header: string[]): ColumnMap | null {
  const h = header.map((x) => x.toLowerCase())
  if (APP_EXPORT_HEADER.some((name, i) => h[i] !== name)) return null
  const map: ColumnMap = { fecha: 0, tipo: 1, categoria: 2, concepto: 4, monto: 5 }
  if (APP_EXPORT_CURRENCY.every((name, i) => h[6 + i] === name)) Object.assign(map, { moneda: 6, montoOriginal: 7, tasa: 8 })
  if (h[9] === "cuenta") map.cuenta = 9
  return map
}

// Best guess for a generic file, from common header names in Spanish and English.
export function guessColumns(header: string[]): Partial<ColumnMap> {
  const names: Record<"fecha" | "concepto" | "monto" | "tipo" | "categoria", RegExp> = {
    fecha: /^(fecha|date|fecha de operaci[oó]n|dia|día)/i,
    concepto: /^(concepto|descripci[oó]n|description|detalle|glosa|memo|concept)/i,
    monto: /^(monto|importe|amount|valor|cargo\/abono|value)/i,
    tipo: /^(tipo|type)$/i,
    categoria: /^(categor[ií]a|category)$/i,
  }
  const out: Partial<ColumnMap> = {}
  for (const key of Object.keys(names) as (keyof typeof names)[]) {
    const i = header.findIndex((h) => names[key].test(h.trim()))
    if (i >= 0) out[key] = i
  }
  return out
}

// "1,234.56", "1.234,56", "-S/ 45", "(12.00)" → number; null if it isn't one.
export function parseAmount(raw: string): number | null {
  let s = unguardCell(raw).trim()
  if (!s) return null
  let negative = false
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1) }
  if (s.includes("-")) negative = true
  s = s.replace(/[^\d.,]/g, "")
  if (!/\d/.test(s)) return null
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".")
  if (lastComma >= 0 && lastDot >= 0) {
    // Both: the last one is the decimal separator.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  } else if (lastComma >= 0) {
    // Only commas: "12,5" / "12,50" is a decimal, "1,234" / "1,234,567" are thousands.
    s = /^\d+,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "")
  } else if ((s.match(/\./g)?.length ?? 0) > 1) {
    s = s.replace(/\./g, "") // "1.234.567"
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

// "2026-01-31", "2026-01-31 14:05", "2026-01-31T14:05:00" or "31/01/2026" (local time).
// A date without a time gets 12:00, so no time zone moves it to another day.
export function parseDate(raw: string): Date | null {
  const s = raw.trim()
  let y: number, mo: number, d: number, h = 12, mi = 0
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/)
  if (m) { [y, mo, d] = [+m[1], +m[2], +m[3]]; if (m[4]) { h = +m[4]; mi = +m[5] } }
  else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2}))?$/))) {
    [d, mo, y] = [+m[1], +m[2], +m[3]]; if (m[4]) { h = +m[4]; mi = +m[5] }
  } else return null
  const date = new Date(y, mo - 1, d, h, mi)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d || h > 23) return null
  return date
}

function parseTipo(raw: string | undefined): TxType | null {
  const s = normalizeConcept(raw ?? "")
  if (["INGRESO", "INCOME", "ABONO", "CREDITO", "CREDIT"].includes(s)) return "INGRESO"
  if (["EGRESO", "EXPENSE", "GASTO", "CARGO", "DEBITO", "DEBIT"].includes(s)) return "EGRESO"
  return null
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
type Money = Pick<Transaction, "valor" | "moneda" | "montoOriginal">
// The amount as it was entered: in another currency, what was typed, so a file imported
// again on a day with another rate still matches.
const amountKey = (m: Money) =>
  m.moneda && m.moneda !== "PEN" && m.montoOriginal != null ? `${m.moneda}:${m.montoOriginal.toFixed(2)}` : `PEN:${m.valor.toFixed(2)}`
const txKey = (date: Date, concepto: string, money: Money, tipo: TxType) =>
  `${dayKey(date)}|${normalizeConcept(concepto)}|${amountKey(money)}|${tipo}`
const round2 = (n: number) => Math.round(n * 100) / 100

export type ImportRow = {
  line: number // 1-based line in the file, header = 1
  date: Date
  concepto: string
  valor: number // PEN, > 0
  // The currency it was entered in, what was typed and the rate (see Transaction).
  moneda: string
  montoOriginal: number | null
  tasa: number | null
  cuentaId: string | null // the account with the file's `cuenta` name, if there is one
  tipo: TxType
  categoria: string | null // null: needs the default category chosen in the preview
  categorySource: "file" | "suggested" | "default"
  duplicate: boolean
}
export type InvalidRow = { line: number; reason: "date" | "amount" | "concept" }

export type BuildOptions = {
  txs: Transaction[]
  customCategoryIds: string[] // "custom_<id>" keys that exist
  currency: string // amounts of a generic file are all in this currency
  amountsInBase: boolean // true for the app's own export (monto_pen)
  accounts?: { id?: string; name: string }[] // to link rows by the account's name
}

const isKnownCategory = (cat: string, tipo: TxType, custom: Set<string>) =>
  custom.has(cat) || (tipo === "INGRESO" ? cat in CATEGORIES.income : cat in CATEGORIES.expense)

export function buildImport(table: CsvTable, map: ColumnMap, opts: BuildOptions) {
  const custom = new Set(opts.customCategoryIds)
  // Duplicates: each transaction already saved "absorbs" one identical row of the file,
  // so re-importing an export skips everything, while two identical coffees in a new
  // file are both imported.
  const existing = new Map<string, number>()
  for (const tx of opts.txs) {
    const k = txKey(tx.date, tx.concepto, tx, tx.tipo)
    existing.set(k, (existing.get(k) ?? 0) + 1)
  }

  const rows: ImportRow[] = []
  const invalid: InvalidRow[] = []
  table.rows.slice(0, MAX_IMPORT_ROWS).forEach((cells, i) => {
    const line = i + 2
    const cell = (idx: number | undefined) => (idx == null ? "" : unguardCell(cells[idx] ?? "").trim())
    const date = parseDate(cell(map.fecha))
    if (!date) return void invalid.push({ line, reason: "date" })
    const amount = parseAmount(cell(map.monto))
    if (amount == null || amount === 0) return void invalid.push({ line, reason: "amount" })
    const concepto = cell(map.concepto).toUpperCase().slice(0, 100)
    if (!concepto) return void invalid.push({ line, reason: "concept" })

    const tipo = parseTipo(cell(map.tipo)) ?? (amount < 0 ? "EGRESO" : "INGRESO")
    const valor = opts.amountsInBase ? round2(Math.abs(amount)) : toBase(Math.abs(amount), opts.currency)
    if (valor <= 0) return void invalid.push({ line, reason: "amount" })

    // The app's export says per row what was typed and in which currency; a generic file
    // is all in opts.currency, at today's rate. PEN keeps no original (it is `valor`).
    let money: Pick<ImportRow, "valor" | "moneda" | "montoOriginal" | "tasa"> = { valor, moneda: "PEN", montoOriginal: null, tasa: null }
    if (opts.amountsInBase) {
      const code = cell(map.moneda).toUpperCase()
      const original = parseAmount(cell(map.montoOriginal))
      if (code !== "PEN" && code in CURRENCIES && original != null && original > 0) {
        const rate = parseAmount(cell(map.tasa))
        money = { valor, moneda: code, montoOriginal: round2(original), tasa: rate != null && rate > 0 ? rate : original / valor }
      }
    } else if (currencyOf(opts.currency).code !== "PEN") {
      const c = currencyOf(opts.currency)
      money = { valor, moneda: c.code, montoOriginal: round2(Math.abs(amount)), tasa: c.rate }
    }

    let categoria: string | null = null
    let categorySource: ImportRow["categorySource"] = "default"
    const fileCat = cell(map.categoria)
    if (fileCat && isKnownCategory(fileCat, tipo, custom)) { categoria = fileCat; categorySource = "file" }
    else {
      const s = suggestCategory(concepto, opts.txs, tipo)
      if (s && isKnownCategory(s.categoria, tipo, custom)) { categoria = s.categoria; categorySource = "suggested" }
    }

    const accountName = normalizeConcept(cell(map.cuenta))
    const cuentaId = (accountName && opts.accounts?.find((a) => normalizeConcept(a.name) === accountName)?.id) || null

    const k = txKey(date, concepto, money, tipo)
    const left = existing.get(k) ?? 0
    if (left > 0) existing.set(k, left - 1)
    rows.push({ line, date, concepto, ...money, cuentaId, tipo, categoria, categorySource, duplicate: left > 0 })
  })
  return { rows, invalid, truncated: table.rows.length > MAX_IMPORT_ROWS }
}
