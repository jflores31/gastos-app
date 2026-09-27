import { describe, it, expect } from "vitest"
import { upcomingPayments } from "./helpers"

const tx = (categoria, concepto, valor, y, m, d, tipo = "EGRESO") => {
  const date = new Date(y, m, d, 10)
  return { id: `${concepto}-${y}-${m}-${d}`, tipo, categoria, concepto, valor, date, dia: d, mes: m, año: y, anomaly: false }
}
// Paid on `day` in each of the given months of 2026 (0-based).
const monthly = (categoria, concepto, valor, day, months, tipo) => months.map((m) => tx(categoria, concepto, valor, 2026, m, day, tipo))
const sub = (name, price, cycle = "monthly", category = "STREAMING") => ({ id: name, name, price, cycle, category })
const d = (m, day) => new Date(2026, m, day)

describe("upcomingPayments", () => {
  it("un recurrente ya pagado este mes vence el mes siguiente; uno pendiente, este mes", () => {
    const txs = [...monthly("VIVIENDA", "ALQUILER", 1200, 1, [5, 6, 7, 8]), ...monthly("SALUD", "SEGURO", 90, 20, [5, 6, 7])]
    const list = upcomingPayments(txs, [], d(8, 10)) // Sep 10
    expect(list.map((p) => [p.concepto, p.due, p.overdue])).toEqual([
      ["SEGURO", d(8, 20), false],
      ["ALQUILER", d(9, 1), false],
    ])
  })

  it("si el día ya pasó y no está registrado, sale como vencido (este mes)", () => {
    const txs = monthly("TRANSPORTE", "BUS", 60, 15, [5, 6, 7])
    expect(upcomingPayments(txs, [], d(8, 27))).toEqual([
      expect.objectContaining({ concepto: "BUS", due: d(8, 15), overdue: true, amount: 60 }),
    ])
  })

  it("cada pago mensual aparece una vez: el día 31 se ajusta a meses cortos y el 1 del mes siguiente entra", () => {
    const rent = monthly("VIVIENDA", "ALQUILER", 1200, 31, [0, 2, 4, 6])
    expect(upcomingPayments(rent, [], new Date(2026, 1, 3))[0].due).toEqual(new Date(2026, 1, 28)) // Feb 28
    const first = monthly("VIVIENDA", "ALQUILER", 1200, 1, [4, 5, 6, 7])
    expect(upcomingPayments(first, [], d(7, 1))[0].due).toEqual(d(8, 1)) // paid Aug 1 → Sep 1, exactly one month
  })

  it("una suscripción con el mismo nombre que un recurrente se une a él, con el precio de la suscripción", () => {
    const txs = monthly("STREAMING", "NETFLIX", 45, 1, [5, 6, 7, 8])
    const list = upcomingPayments(txs, [sub("Netflix", 49.9)], d(8, 10))
    expect(list).toEqual([expect.objectContaining({ concepto: "NETFLIX", amount: 49.9, due: d(9, 1), source: "recurring" })])
  })

  it("suscripciones sin recurrente: fecha desde su último pago (mensual o anual); una mensual nunca pagada va sin fecha al final", () => {
    const txs = [tx("STREAMING", "SPOTIFY FAMILY", 25, 2026, 7, 12), tx("EDUCACION", "DOMINIO WEB", 60, 2025, 8, 20)]
    const list = upcomingPayments(txs, [sub("Spotify", 25), sub("Dominio web", 60, "yearly", "EDUCACION"), sub("Disney", 30), sub("Revista", 100, "yearly")], d(8, 10))
    expect(list.map((p) => [p.concepto, p.due])).toEqual([
      ["Spotify", d(8, 12)],
      ["Dominio web", d(8, 20)],
      ["Disney", null],
    ])
  })

  it("una anual cuyo próximo cobro cae después del mes no aparece; los ingresos nunca aparecen", () => {
    const txs = [tx("EDUCACION", "DOMINIO WEB", 60, 2026, 2, 20), ...monthly("SUELDO", "SUELDO", 3500, 1, [5, 6, 7], "INGRESO")]
    expect(upcomingPayments(txs, [sub("Dominio web", 60, "yearly", "EDUCACION")], d(8, 10))).toEqual([])
  })
})
