import { describe, it, expect } from "vitest"
import { CATEGORIES } from "../data/index"
import {
  EXPENSE_ICONS, INCOME_ICONS, ICON_CHOICES, DEFAULT_ICON, iconByName, resolveCategoryMeta,
} from "./categoryIcons.js"

describe("mapa de iconos por categoría", () => {
  it("cada categoría de egreso tiene icono", () => {
    const missing = Object.keys(CATEGORIES.expense).filter((k) => !EXPENSE_ICONS[k])
    expect(missing).toEqual([])
  })

  it("cada categoría de ingreso tiene icono", () => {
    const missing = Object.keys(CATEGORIES.income).filter((k) => !INCOME_ICONS[k])
    expect(missing).toEqual([])
  })

  it("no hay claves huérfanas (icono para una categoría que ya no existe)", () => {
    expect(Object.keys(EXPENSE_ICONS).filter((k) => !CATEGORIES.expense[k])).toEqual([])
    expect(Object.keys(INCOME_ICONS).filter((k) => !CATEGORIES.income[k])).toEqual([])
  })
})

describe("iconByName", () => {
  it("resuelve claves de ICON_CHOICES", () => {
    expect(iconByName("Flight")).toBe(ICON_CHOICES.Flight)
  })

  it("devuelve null para glifos viejos, vacíos o claves del prototipo", () => {
    expect(iconByName("◉")).toBeNull()
    expect(iconByName("")).toBeNull()
    expect(iconByName(null)).toBeNull()
    expect(iconByName("toString")).toBeNull()
  })
})

describe("resolveCategoryMeta", () => {
  const customCats = [{ id: "abc", nombre: "Gatos", color: "#123456", icon: "Pets", tipo: "EGRESO" }]

  it("categoría de fábrica: nombre por idioma, color e icono", () => {
    const es = resolveCategoryMeta("COMIDA", [], "es")
    expect(es).toEqual({ label: "Comida", color: CATEGORIES.expense.COMIDA.color, Icon: EXPENSE_ICONS.COMIDA })
    expect(resolveCategoryMeta("COMIDA", [], "en").label).toBe("Food")
  })

  it("categoría de ingreso sin tipo explícito", () => {
    expect(resolveCategoryMeta("SUELDO", [], "es").Icon).toBe(INCOME_ICONS.SUELDO)
  })

  it("claves en ambos grupos (REGALOS) desempatan por tipo", () => {
    expect(resolveCategoryMeta("REGALOS", [], "es", "INGRESO").label).toBe(CATEGORIES.income.REGALOS.es)
    expect(resolveCategoryMeta("REGALOS", [], "es", "EGRESO").label).toBe(CATEGORIES.expense.REGALOS.es)
  })

  it("categoría personalizada con icono guardado", () => {
    expect(resolveCategoryMeta("custom_abc", customCats, "es")).toEqual({
      label: "Gatos", color: "#123456", Icon: ICON_CHOICES.Pets,
    })
  })

  it("personalizada borrada o sin icono cae en valores genéricos", () => {
    const gone = resolveCategoryMeta("custom_zzz", customCats, "es")
    expect(gone.label).toBe("custom_zzz")
    expect(gone.Icon).toBe(DEFAULT_ICON)
    expect(gone.color).toMatch(/^#/)
    const noIcon = resolveCategoryMeta("custom_abc", [{ ...customCats[0], icon: null }], "es")
    expect(noIcon.Icon).toBe(DEFAULT_ICON)
  })

  it("clave desconocida no rompe", () => {
    const meta = resolveCategoryMeta("NO_EXISTE", [], "es")
    expect(meta).toMatchObject({ label: "NO_EXISTE", Icon: DEFAULT_ICON })
  })
})
