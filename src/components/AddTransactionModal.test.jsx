// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { MESSAGES } from "../i18n/index"
import { setLiveRates } from "@/domain/money"
import AddTransactionModal from "./AddTransactionModal.jsx"

// The modal reads settings, data and the user from contexts: replace them with stubs so the
// test controls the selected currency and can inspect what gets saved.
const as = (currency) => ({ t: MESSAGES.es, lang: "es", currency, fmt: (v) => `PEN ${v}` })
const settings = { current: as("PEN") }
const data = { addTx: vi.fn(), updateTx: vi.fn(), customCats: [] }
vi.mock("../context/SettingsContext", () => ({ useSettings: () => settings.current }))
vi.mock("../context/DataContext.jsx", () => ({ useData: () => data }))
vi.mock("../context/UserContext", () => ({ useSupabaseUser: () => null }))

const renderModal = (props = {}) =>
  render(<AddTransactionModal initialCategory="COMIDA" mode="expense" onClose={vi.fn()} showToast={vi.fn()} {...props} />)

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const pickCurrency = (code) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Moneda" }))
  fireEvent.click(screen.getByRole("option", { name: new RegExp(code) }))
}

describe("AddTransactionModal — moneda", () => {
  beforeEach(() => {
    data.addTx = vi.fn(() => Promise.resolve())
    data.updateTx = vi.fn(() => Promise.resolve())
    data.accounts = []
  })
  afterEach(() => { cleanup(); setLiveRates({}) })

  it("en PEN guarda el monto tal cual", async () => {
    settings.current = as("PEN")
    renderModal()
    fill(/Concepto/, "almuerzo")
    fill(/Monto/, "100")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0]).toMatchObject({ tipo: "EGRESO", categoria: "COMIDA", concepto: "ALMUERZO", valor: 100, moneda: "PEN" })
  })

  it("en USD convierte a PEN al guardar y guarda lo escrito con la tasa (antes guardaba 100 y mostraba $27)", async () => {
    settings.current = as("USD")
    renderModal()
    expect(screen.getByText("$")).toBeTruthy() // símbolo de la moneda elegida
    fill(/Concepto/, "almuerzo")
    fill(/Monto/, "100")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0]).toMatchObject({ valor: 370.37, moneda: "USD", montoOriginal: 100, tasa: 0.27 }) // 100 / 0.27
  })

  it("se puede registrar en otra moneda que la de la app, con la tasa del día; muestra el equivalente", async () => {
    setLiveRates({ EUR: 0.24 })
    settings.current = as("PEN")
    renderModal()
    pickCurrency("EUR")
    fill(/Concepto/, "museo")
    fill(/Monto/, "24")
    expect(screen.getByText("≈ PEN 100")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0]).toMatchObject({ valor: 100, moneda: "EUR", montoOriginal: 24, tasa: 0.24 })
  })

  it("al editar precarga la moneda y el monto de la transacción; una en PEN se guarda igual", async () => {
    settings.current = as("USD")
    const editTx = { id: "t1", tipo: "EGRESO", categoria: "COMIDA", concepto: "ALMUERZO", valor: 370.37, moneda: "PEN", montoOriginal: null, tasa: null, date: new Date() }
    renderModal({ editTx })
    expect(screen.getByLabelText(/Monto/).value).toBe("370.37")
    expect(screen.getByRole("combobox", { name: "Moneda" }).textContent).toBe("PEN")
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }))
    await waitFor(() => expect(data.updateTx).toHaveBeenCalledTimes(1))
    expect(data.updateTx.mock.calls[0][0]).toMatchObject({ id: "t1", valor: 370.37, moneda: "PEN" })
  })

  it("al editar una en USD mantiene la tasa con que se guardó, aunque la de hoy sea otra", async () => {
    setLiveRates({ USD: 0.25 })
    settings.current = as("PEN")
    const editTx = { id: "t2", tipo: "EGRESO", categoria: "COMIDA", concepto: "CENA", valor: 370.37, moneda: "USD", montoOriginal: 100, tasa: 0.27, date: new Date() }
    renderModal({ editTx })
    expect(screen.getByLabelText(/Monto/).value).toBe("100")
    fill(/Concepto/, "cena con amigos")
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }))
    await waitFor(() => expect(data.updateTx).toHaveBeenCalledTimes(1))
    expect(data.updateTx.mock.calls[0][0]).toMatchObject({ valor: 370.37, moneda: "USD", montoOriginal: 100, tasa: 0.27 })
  })

  it("al editar y cambiar de moneda usa la tasa de hoy de la nueva", async () => {
    setLiveRates({ EUR: 0.25 })
    settings.current = as("PEN")
    const editTx = { id: "t3", tipo: "EGRESO", categoria: "COMIDA", concepto: "CENA", valor: 370.37, moneda: "USD", montoOriginal: 100, tasa: 0.27, date: new Date() }
    renderModal({ editTx })
    pickCurrency("EUR")
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }))
    await waitFor(() => expect(data.updateTx).toHaveBeenCalledTimes(1))
    expect(data.updateTx.mock.calls[0][0]).toMatchObject({ valor: 400, moneda: "EUR", montoOriginal: 100, tasa: 0.25 })
  })

  it("sin cuentas no muestra el selector; con cuentas se puede asociar una y al editar viene elegida", async () => {
    settings.current = as("PEN")
    renderModal()
    expect(screen.queryByRole("combobox", { name: "Cuenta" })).toBeNull()
    cleanup()

    data.accounts = [{ id: "bcp", name: "BCP" }, { id: "cash", name: "Efectivo" }]
    renderModal()
    fill(/Concepto/, "menu")
    fill(/Monto/, "15")
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Cuenta" }))
    fireEvent.click(screen.getByRole("option", { name: "BCP" }))
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0]).toMatchObject({ valor: 15, cuentaId: "bcp" })
    cleanup()

    const editTx = { id: "t4", tipo: "EGRESO", categoria: "COMIDA", concepto: "MENU", valor: 15, moneda: "PEN", cuentaId: "cash", date: new Date() }
    renderModal({ editTx })
    expect(screen.getByRole("combobox", { name: "Cuenta" }).textContent).toBe("Efectivo")
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Cuenta" }))
    fireEvent.click(screen.getByRole("option", { name: "Sin cuenta" }))
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }))
    await waitFor(() => expect(data.updateTx).toHaveBeenCalledTimes(1))
    expect(data.updateTx.mock.calls[0][0]).toMatchObject({ id: "t4", cuentaId: null })
  })

  it("valida el tope de 10,000,000 en PEN, no en la moneda del formulario", async () => {
    settings.current = as("COP")
    renderModal()
    fill(/Concepto/, "auto")
    fill(/Monto/, "20000000") // 20M COP ≈ 18,182 PEN: permitido
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0].valor).toBe(18181.82)
  })
})
