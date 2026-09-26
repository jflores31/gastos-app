import { describe, it, expect } from "vitest"
import { CURRENCIES, toBase, fromBase, fmtMoney } from "./index.js"

describe("toBase / fromBase", () => {
  it("PEN es la moneda base: no convierte", () => {
    expect(toBase(123.45, "PEN")).toBe(123.45)
    expect(fromBase(123.45, "PEN")).toBe(123.45)
  })

  it("convierte a PEN dividiendo por la tasa y redondea a 2 decimales", () => {
    expect(toBase(100, "USD")).toBe(370.37) // 100 / 0.27
    expect(toBase(1100, "COP")).toBe(1)
  })

  it("lo que se escribe en el formulario es lo que luego muestra fmtMoney", () => {
    // Antes: se guardaba 100 tal cual y con USD se mostraba $27.
    expect(fmtMoney(toBase(100, "USD"), "USD")).toBe("$100")
    expect(fmtMoney(toBase(50, "EUR"), "EUR")).toBe("€50")
  })

  it.each(Object.keys(CURRENCIES))("ida y vuelta estable en %s", (curr) => {
    // Error máximo: redondeo a 2 decimales en PEN (medio céntimo × tasa) más el
    // redondeo a 2 decimales al volver a la moneda del formulario (medio céntimo).
    const maxErr = 0.005 * CURRENCIES[curr].rate + 0.005 + 1e-9
    for (const v of [1, 9.99, 100, 2500.5, 1_000_000]) {
      expect(Math.abs(fromBase(toBase(v, curr), curr) - v)).toBeLessThanOrEqual(maxErr)
    }
  })

  it("moneda desconocida cae en PEN", () => {
    expect(toBase(10, "XXX")).toBe(10)
    expect(fromBase(10, "XXX")).toBe(10)
  })

  it("acepta strings numéricos", () => {
    expect(toBase("27", "USD")).toBe(100)
    expect(fromBase("100", "USD")).toBe(27)
  })
})

describe("fmtMoney — formato por idioma", () => {
  it("usa el locale que recibe, no el del navegador", () => {
    expect(fmtMoney(3500, "PEN", false, "es-PE")).toBe("S/3,500")
    expect(fmtMoney(3500, "PEN", false, "en-US")).toBe("S/3,500")
    // Un locale con otro separador demuestra que se usa el argumento.
    expect(fmtMoney(3500, "PEN", false, "de-DE")).toBe("S/3.500")
    expect(fmtMoney(3_700_000, "PEN", true, "de-DE")).toBe("S/3,7M")
  })

  it("sin locale usa es-PE (igual en el servidor y en el navegador)", () => {
    expect(fmtMoney(1234.5)).toBe("S/1,235")
    expect(fmtMoney(12.5)).toBe("S/12.5")
    expect(fmtMoney(3500, "PEN", true)).toBe("S/3.5k")
  })

  it("los negativos grandes se redondean igual que los positivos", () => {
    // Antes: -1234.56 salía con decimales porque se comparaba n >= 100 sin valor absoluto.
    expect(fmtMoney(-1234.56)).toBe("S/-1,235")
    expect(fmtMoney(-12.5)).toBe("S/-12.5")
  })
})
