import { describe, it, expect } from "vitest"
import { csvCell, transactionsToCsv, backupToJson, exportFileName, localDateTime } from "./export"

const tx = (over) => ({ id: "t1", tipo: "EGRESO", categoria: "COMIDA", concepto: "MENU", valor: 12.5, date: new Date(2026, 8, 3, 14, 5), ...over })

describe("csvCell", () => {
  it("deja tal cual lo simple y los números", () => {
    expect(csvCell("MENU")).toBe("MENU")
    expect(csvCell(12.5)).toBe("12.5")
    expect(csvCell(null)).toBe("")
  })

  it("entrecomilla comas, comillas y saltos de línea (RFC 4180)", () => {
    expect(csvCell("pan, leche")).toBe('"pan, leche"')
    expect(csvCell('dijo "hola"')).toBe('"dijo ""hola"""')
    expect(csvCell("a\nb")).toBe('"a\nb"')
  })

  it("neutraliza lo que Excel ejecutaría como fórmula", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell("+51 999")).toBe("'+51 999")
    expect(csvCell("-algo")).toBe("'-algo")
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)")
  })
})

describe("transactionsToCsv", () => {
  it("BOM, cabecera, filas ordenadas por fecha en hora local y nombre de categoría", () => {
    const csv = transactionsToCsv(
      [tx({ id: "b", date: new Date(2026, 8, 5, 9, 0), concepto: "PAN, LECHE" }), tx({ id: "a", tipo: "INGRESO", categoria: "SUELDO", concepto: "SUELDO", valor: 3500 })],
      (cat) => ({ COMIDA: "Comida", SUELDO: "Sueldo" })[cat],
    )
    expect(csv.startsWith("﻿")).toBe(true)
    expect(csv.slice(1).split("\r\n")).toEqual([
      "fecha,tipo,categoria,categoria_nombre,concepto,monto_pen",
      "2026-09-03 14:05,INGRESO,SUELDO,Sueldo,SUELDO,3500",
      '2026-09-05 09:00,EGRESO,COMIDA,Comida,"PAN, LECHE",12.5',
      "",
    ])
  })

  it("sin transacciones queda solo la cabecera", () => {
    expect(transactionsToCsv([], () => "")).toBe("﻿fecha,tipo,categoria,categoria_nombre,concepto,monto_pen\r\n")
  })
})

describe("backupToJson", () => {
  it("incluye todas las tablas, la versión y la moneda base", () => {
    const data = {
      txs: [tx()], editBudgets: { COMIDA: 600 },
      goals: [{ id: "g" }], accounts: [{ id: "a" }], investments: [{ id: "i" }], debts: [{ id: "d" }],
      subscriptions: [{ id: "s" }], customCats: [{ id: "c" }],
    }
    const out = JSON.parse(backupToJson(data, new Date("2026-09-26T12:00:00Z")))
    expect(out).toMatchObject({ app: "gastos-app", version: 1, exported_at: "2026-09-26T12:00:00.000Z", currency: "PEN" })
    expect(out.transactions).toEqual([{ id: "t1", fecha: tx().date.toISOString(), tipo: "EGRESO", categoria: "COMIDA", concepto: "MENU", valor: 12.5 }])
    expect(out.budgets).toEqual([{ categoria: "COMIDA", monto: 600 }])
    for (const k of ["goals", "accounts", "investments", "debts", "subscriptions", "custom_categories"]) expect(out[k]).toHaveLength(1)
  })
})

it("exportFileName y localDateTime usan la fecha local", () => {
  expect(exportFileName("transacciones", "csv", new Date(2026, 0, 7))).toBe("finanzas-transacciones-2026-01-07.csv")
  expect(localDateTime(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31 23:59")
})
