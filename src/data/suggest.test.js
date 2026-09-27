import { describe, it, expect } from "vitest"
import { suggestCategory, normalizeConcept } from "./suggest"

const tx = (categoria, concepto, day, tipo = "EGRESO") => ({
  id: `${categoria}-${day}`, tipo, categoria, concepto, valor: 10,
  date: new Date(2026, 0, day), dia: day, mes: 0, año: 2026, anomaly: false,
})

describe("normalizeConcept", () => {
  it("ignora mayúsculas, tildes y espacios de más", () => {
    expect(normalizeConcept("  Café  del día ")).toBe("CAFE DEL DIA")
    expect(normalizeConcept("cumpleaños")).toBe("CUMPLEANOS")
  })
})

describe("suggestCategory — historial", () => {
  it("elige la categoría más usada con ese concepto", () => {
    const txs = [tx("COMIDA", "MERCADO", 1), tx("COMIDA", "MERCADO", 2), tx("COMPRAS", "MERCADO", 3)]
    expect(suggestCategory("mercado", txs)).toEqual({ categoria: "COMIDA", tipo: "EGRESO", source: "history" })
  })

  it("con empate gana la más reciente, y cuentan las categorías propias", () => {
    const txs = [tx("COMIDA", "PAN", 1), tx("custom_7", "Pan", 5)]
    expect(suggestCategory("PAN ", txs)).toMatchObject({ categoria: "custom_7", source: "history" })
  })

  it("respeta el tipo pedido (ingreso o egreso)", () => {
    const txs = [tx("SUELDO", "BONO", 1, "INGRESO")]
    expect(suggestCategory("BONO", txs, "EGRESO")).toBeNull()
    expect(suggestCategory("BONO", txs, "INGRESO")).toMatchObject({ categoria: "SUELDO", tipo: "INGRESO" })
  })

  it("el historial gana al catálogo", () => {
    expect(suggestCategory("NETFLIX", [tx("SALIDAS", "NETFLIX", 1)])).toMatchObject({ categoria: "SALIDAS", source: "history" })
  })
})

describe("suggestCategory — catálogo", () => {
  it("un concepto de la lista, solo o dentro del texto, sugiere su categoría", () => {
    expect(suggestCategory("Netflix", [])).toEqual({ categoria: "STREAMING", tipo: "EGRESO", source: "catalog" })
    expect(suggestCategory("pago netflix enero", [])).toMatchObject({ categoria: "STREAMING" })
    expect(suggestCategory("comida a domicilio", [], "EGRESO")).toMatchObject({ categoria: "DELIVERY" })
  })

  it("el nombre de la categoría también cuenta", () => {
    expect(suggestCategory("gasolina grifo", [])).toMatchObject({ categoria: "GASOLINA" })
    expect(suggestCategory("sueldo", [], "INGRESO")).toMatchObject({ categoria: "SUELDO", tipo: "INGRESO" })
  })

  it("solo palabras completas: 'BUSCAR' no es 'BUS'", () => {
    expect(suggestCategory("buscar llaves", [])).toBeNull()
  })

  it("gana la categoría con más palabras coincidentes", () => {
    expect(suggestCategory("mantenimiento moto", [])).toMatchObject({ categoria: "MOTO" })
  })

  it("si empatan varias categorías, no sugiere nada", () => {
    expect(suggestCategory("mantenimiento", [])).toBeNull() // AUTO y MOTO
    expect(suggestCategory("regalos", [])).toBeNull() // ingreso y egreso
    expect(suggestCategory("regalos", [], "EGRESO")).toMatchObject({ categoria: "REGALOS", tipo: "EGRESO" })
  })

  it("textos de menos de 2 letras o sin coincidencias no sugieren nada", () => {
    expect(suggestCategory("a", [])).toBeNull()
    expect(suggestCategory("xyz", [])).toBeNull()
  })
})
