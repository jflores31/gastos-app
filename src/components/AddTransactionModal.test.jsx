// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { I18N } from "../data/index.js"
import AddTransactionModal from "./AddTransactionModal.jsx"

// The modal reads settings, data and the user from contexts: replace them with stubs so the
// test controls the selected currency and can inspect what gets saved.
const settings = { current: { t: I18N.es, lang: "es", currency: "PEN" } }
const data = { addTx: vi.fn(), updateTx: vi.fn(), customCats: [] }
vi.mock("../context/SettingsContext.jsx", () => ({ useSettings: () => settings.current }))
vi.mock("../context/DataContext.jsx", () => ({ useData: () => data }))
vi.mock("../context/UserContext", () => ({ useSupabaseUser: () => null }))

const renderModal = (props = {}) =>
  render(<AddTransactionModal initialCategory="COMIDA" mode="expense" onClose={vi.fn()} showToast={vi.fn()} {...props} />)

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe("AddTransactionModal — moneda", () => {
  beforeEach(() => {
    data.addTx = vi.fn(() => Promise.resolve())
    data.updateTx = vi.fn(() => Promise.resolve())
  })
  afterEach(cleanup)

  it("en PEN guarda el monto tal cual", async () => {
    settings.current = { t: I18N.es, lang: "es", currency: "PEN" }
    renderModal()
    fill(/Concepto/, "almuerzo")
    fill(/Monto/, "100")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0]).toMatchObject({ tipo: "EGRESO", categoria: "COMIDA", concepto: "ALMUERZO", valor: 100 })
  })

  it("en USD convierte a PEN al guardar (antes guardaba 100 y mostraba $27)", async () => {
    settings.current = { t: I18N.es, lang: "es", currency: "USD" }
    renderModal()
    expect(screen.getByText("$")).toBeTruthy() // símbolo de la moneda elegida
    fill(/Concepto/, "almuerzo")
    fill(/Monto/, "100")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0].valor).toBe(370.37) // 100 / 0.27
  })

  it("al editar en USD precarga el monto en USD y lo vuelve a guardar en PEN", async () => {
    settings.current = { t: I18N.es, lang: "es", currency: "USD" }
    const editTx = { id: "t1", tipo: "EGRESO", categoria: "COMIDA", concepto: "ALMUERZO", valor: 370.37, date: new Date() }
    renderModal({ editTx })
    expect(screen.getByLabelText(/Monto/).value).toBe("100")
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }))
    await waitFor(() => expect(data.updateTx).toHaveBeenCalledTimes(1))
    expect(data.updateTx.mock.calls[0][0]).toMatchObject({ id: "t1", valor: 370.37 })
  })

  it("valida el tope de 10,000,000 en PEN, no en la moneda del formulario", async () => {
    settings.current = { t: I18N.es, lang: "es", currency: "COP" }
    renderModal()
    fill(/Concepto/, "auto")
    fill(/Monto/, "20000000") // 20M COP ≈ 18,182 PEN: permitido
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.addTx).toHaveBeenCalledTimes(1))
    expect(data.addTx.mock.calls[0][0].valor).toBe(18181.82)
  })
})
