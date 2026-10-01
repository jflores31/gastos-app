import { describe, it, expect, afterEach } from "vitest"
import { parseCsv, parseAmount, parseDate, detectAppFormat, guessColumns, buildImport, unguardCell } from "./csvImport"
import { transactionsToCsv } from "./export"
import { setLiveRates } from "@/domain/money"

const tx = (tipo, categoria, concepto, valor, date, currency = {}) => ({
  id: `${concepto}-${valor}`, tipo, categoria, concepto, valor, date,
  dia: date.getDate(), mes: date.getMonth(), año: date.getFullYear(), anomaly: false,
  moneda: "PEN", montoOriginal: null, tasa: null, ...currency,
})

describe("parseCsv", () => {
  it("RFC 4180: comillas, comillas dobles, comas y saltos de línea dentro de un campo, CRLF y BOM", () => {
    const text = '\uFEFFa,b,c\r\n1,"x, ""y""",3\r\n"multi\nlínea",,z\r\n\r\n'
    expect(parseCsv(text)).toEqual({ header: ["a", "b", "c"], rows: [["1", 'x, "y"', "3"], ["multi\nlínea", "", "z"]] })
  })

  it("detecta el ; de Excel en español", () => {
    expect(parseCsv("fecha;concepto;monto\n01/02/2026;Pan;12,50").rows).toEqual([["01/02/2026", "Pan", "12,50"]])
  })
})

describe("parseAmount", () => {
  it.each([
    ["12.5", 12.5], ["1234.56", 1234.56], ["1,234.56", 1234.56], ["1.234,56", 1234.56],
    ["12,50", 12.5], ["1,234", 1234], ["1.234.567", 1234567], ["-S/ 45", -45], ["S/ -45.00", -45],
    ["(12.00)", -12], ["$ 1,000", 1000], ["'-20", -20],
  ])("%s → %d", (raw, n) => expect(parseAmount(raw)).toBe(n))

  it("sin dígitos no es un monto", () => {
    expect(parseAmount("")).toBeNull()
    expect(parseAmount("abc")).toBeNull()
  })
})

describe("parseDate", () => {
  it("ISO con y sin hora, y DD/MM/YYYY; sin hora queda a mediodía (hora local)", () => {
    expect(parseDate("2026-01-31 14:05")).toEqual(new Date(2026, 0, 31, 14, 5))
    expect(parseDate("2026-01-31T09:00:00Z")).toEqual(new Date(2026, 0, 31, 9, 0))
    expect(parseDate("2026-01-31")).toEqual(new Date(2026, 0, 31, 12, 0))
    expect(parseDate("31/01/2026")).toEqual(new Date(2026, 0, 31, 12, 0))
  })

  it("rechaza fechas imposibles o en otro formato", () => {
    expect(parseDate("2026-02-30")).toBeNull()
    expect(parseDate("31/13/2026")).toBeNull()
    expect(parseDate("enero 5")).toBeNull()
  })
})

describe("columnas", () => {
  it("reconoce el formato de exportación de la app, con y sin las columnas de moneda", () => {
    const base = ["fecha", "tipo", "categoria", "categoria_nombre", "concepto", "monto_pen"]
    expect(detectAppFormat(base)).toEqual({ fecha: 0, tipo: 1, categoria: 2, concepto: 4, monto: 5 })
    expect(detectAppFormat([...base, "moneda", "monto_original", "tasa"]))
      .toEqual({ fecha: 0, tipo: 1, categoria: 2, concepto: 4, monto: 5, moneda: 6, montoOriginal: 7, tasa: 8 })
    expect(detectAppFormat([...base, "moneda", "monto_original", "tasa", "cuenta"]))
      .toEqual({ fecha: 0, tipo: 1, categoria: 2, concepto: 4, monto: 5, moneda: 6, montoOriginal: 7, tasa: 8, cuenta: 9 })
    expect(detectAppFormat(["fecha", "concepto", "monto"])).toBeNull()
  })

  it("adivina las columnas de un archivo de banco", () => {
    expect(guessColumns(["Fecha de operación", "Descripción", "Importe", "Saldo"])).toEqual({ fecha: 0, concepto: 1, monto: 2 })
    expect(guessColumns(["Date", "Description", "Amount", "Type", "Category"])).toEqual({ fecha: 0, concepto: 1, monto: 2, tipo: 3, categoria: 4 })
  })

  it("unguardCell quita la ' que el export pone ante una fórmula", () => {
    expect(unguardCell("'=SUM(A1)")).toBe("=SUM(A1)")
    expect(unguardCell("'hola")).toBe("'hola")
  })
})

describe("buildImport", () => {
  const opts = { txs: [], customCategoryIds: ["custom_7"], currency: "PEN", amountsInBase: false }
  afterEach(() => setLiveRates({}))

  it("archivo genérico: el signo decide el tipo, montos en la moneda elegida, concepto en mayúsculas", () => {
    const table = parseCsv("Fecha,Descripción,Importe\n01/02/2026,Netflix,-45\n02/02/2026,Sueldo febrero,3500")
    const { rows, invalid } = buildImport(table, { fecha: 0, concepto: 1, monto: 2 }, { ...opts, currency: "USD" })
    expect(invalid).toEqual([])
    expect(rows[0]).toMatchObject({ line: 2, concepto: "NETFLIX", tipo: "EGRESO", valor: 166.67, categoria: "STREAMING", categorySource: "suggested" })
    expect(rows[1]).toMatchObject({ tipo: "INGRESO", categoria: "SUELDO", categorySource: "suggested" })
  })

  it("archivo genérico en otra moneda: guarda lo escrito y la tasa del día; en PEN no hay original", () => {
    setLiveRates({ USD: 0.26 })
    const table = parseCsv("fecha,concepto,monto\n2026-02-01,Cena,-26")
    expect(buildImport(table, { fecha: 0, concepto: 1, monto: 2 }, { ...opts, currency: "USD" }).rows[0])
      .toMatchObject({ valor: 100, moneda: "USD", montoOriginal: 26, tasa: 0.26 })
    expect(buildImport(table, { fecha: 0, concepto: 1, monto: 2 }, opts).rows[0])
      .toMatchObject({ valor: 26, moneda: "PEN", montoOriginal: null, tasa: null })
  })

  it("reimportar un archivo en dólares otro día (con otra tasa) lo reconoce como repetido", () => {
    const table = parseCsv("fecha,concepto,monto\n2026-02-01,Cena,-26")
    const map = { fecha: 0, concepto: 1, monto: 2 }
    setLiveRates({ USD: 0.26 })
    const [first] = buildImport(table, map, { ...opts, currency: "USD" }).rows
    const saved = [tx("EGRESO", "COMIDA", first.concepto, first.valor, first.date, { moneda: "USD", montoOriginal: first.montoOriginal, tasa: first.tasa })]
    setLiveRates({ USD: 0.28 })
    const [again] = buildImport(table, map, { ...opts, txs: saved, currency: "USD" }).rows
    expect(again.valor).not.toBe(first.valor)
    expect(again.duplicate).toBe(true)
  })

  it("filas sin categoría reconocible quedan para la categoría por defecto; las inválidas se informan con su línea", () => {
    const table = parseCsv("fecha,concepto,monto\n2026-02-01,Cosa rara,-10\nayer,Pan,-2\n2026-02-01,,-3\n2026-02-01,Pan,abc\n2026-02-01,Pan,0")
    const { rows, invalid } = buildImport(table, { fecha: 0, concepto: 1, monto: 2 }, opts)
    expect(rows).toEqual([expect.objectContaining({ concepto: "COSA RARA", categoria: null, categorySource: "default" })])
    expect(invalid).toEqual([{ line: 3, reason: "date" }, { line: 4, reason: "concept" }, { line: 5, reason: "amount" }, { line: 6, reason: "amount" }])
  })

  it("una categoría del archivo se usa si existe para ese tipo (también las propias)", () => {
    const table = parseCsv("fecha,concepto,monto,tipo,categoria\n2026-02-01,A,10,EGRESO,COMIDA\n2026-02-01,B,10,gasto,custom_7\n2026-02-01,C,10,egreso,NO_EXISTE\n2026-02-01,D,10,EGRESO,SUELDO")
    const { rows } = buildImport(table, { fecha: 0, concepto: 1, monto: 2, tipo: 3, categoria: 4 }, opts)
    expect(rows.map((r) => [r.tipo, r.categoria, r.categorySource])).toEqual([
      ["EGRESO", "COMIDA", "file"], ["EGRESO", "custom_7", "file"], ["EGRESO", null, "default"], ["EGRESO", null, "default"],
    ])
  })

  it("ida y vuelta: exportar e importar da las mismas transacciones; reimportar las marca como repetidas", () => {
    const txs = [
      tx("EGRESO", "COMIDA", "=CAFE", 12.5, new Date(2026, 0, 3, 8, 15)),
      tx("EGRESO", "COMIDA", "=CAFE", 12.5, new Date(2026, 0, 3, 8, 15)),
      tx("INGRESO", "SUELDO", "SUELDO, ENERO", 3500, new Date(2026, 0, 1, 9, 0)),
      tx("EGRESO", "custom_7", 'ARENA "PREMIUM"', 30, new Date(2026, 0, 5, 20, 0)),
      tx("EGRESO", "VIAJES", "HOTEL", 384.62, new Date(2026, 0, 7, 22, 0), { moneda: "USD", montoOriginal: 100, tasa: 0.26, cuentaId: "visa" }),
    ]
    const accounts = [{ id: "visa", name: "Visa Oro" }]
    const csv = transactionsToCsv(txs, (k) => k, (id) => accounts.find((a) => a.id === id)?.name)
    const table = parseCsv(csv)
    const map = detectAppFormat(table.header)
    // The account is found by name, ignoring case and accents; in a user without it, none.
    const fresh = buildImport(table, map, { ...opts, amountsInBase: true, accounts: [{ id: "otra-visa", name: "visa oro" }] })
    expect(buildImport(table, map, { ...opts, amountsInBase: true }).rows.every((r) => r.cuentaId === null)).toBe(true)
    const key = (r) => [r.date.getTime(), r.tipo, r.categoria, r.concepto, r.valor, r.moneda, r.montoOriginal, r.tasa, r.cuentaId && "visa"].join("|")
    expect(fresh.rows.map(key).sort()).toEqual(txs.map(key).sort())
    expect(fresh.rows.every((r) => !r.duplicate && r.categorySource === "file")).toBe(true)

    const again = buildImport(table, map, { ...opts, txs, amountsInBase: true })
    expect(again.rows.every((r) => r.duplicate)).toBe(true)

    // An export from before the currency columns still imports, all in PEN.
    const old = parseCsv(csv.replace(/,moneda,monto_original,tasa,cuenta|,(PEN|USD),[\d.]+,[\d.]+,[^\r\n]*(?=\r\n)/g, ""))
    expect(buildImport(old, detectAppFormat(old.header), { ...opts, amountsInBase: true }).rows.map((r) => [r.valor, r.moneda, r.montoOriginal]))
      .toContainEqual([384.62, "PEN", null])
  })

  it("dos filas idénticas en un archivo nuevo se importan las dos; una ya guardada solo absorbe una", () => {
    const table = parseCsv("fecha,concepto,monto\n2026-02-01,Cafe,-5\n2026-02-01,Café,-5")
    const map = { fecha: 0, concepto: 1, monto: 2 }
    expect(buildImport(table, map, opts).rows.map((r) => r.duplicate)).toEqual([false, false])
    const saved = [tx("EGRESO", "CAFES", "CAFE", 5, new Date(2026, 1, 1, 18, 0))]
    expect(buildImport(table, map, { ...opts, txs: saved }).rows.map((r) => r.duplicate)).toEqual([true, false])
  })
})
