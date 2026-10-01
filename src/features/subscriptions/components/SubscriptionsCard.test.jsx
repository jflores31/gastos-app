// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react"
import { MESSAGES } from "@/i18n"
import { SubscriptionsCard } from "./SubscriptionsCard"

const settings = { t: MESSAGES.es, lang: "es", currency: "PEN", fmt: (v) => `S/${v}` }
const data = {}
vi.mock("@/contexts/SettingsContext", () => ({ useSettings: () => settings }))
vi.mock("@/contexts/DataContext", () => ({ useData: () => data }))

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const categoryCombo = () => screen.getByRole("combobox", { name: "Categoría" })

describe("SubscriptionsCard — iconos y categoría sugerida", () => {
  beforeEach(() => {
    Object.assign(data, {
      txs: [],
      customCats: [],
      subscriptions: [
        { id: "s1", name: "Netflix", price: 45, cycle: "monthly", category: "STREAMING" },
        { id: "s2", name: "Revista", price: 10, cycle: "monthly", category: "" },
      ],
      saveSubscription: vi.fn(() => Promise.resolve()),
      deleteSubscription: vi.fn(),
    })
  })
  afterEach(cleanup)

  it("cada suscripción muestra su categoría; sin categoría, la inicial", () => {
    render(<SubscriptionsCard />)
    const netflix = screen.getByRole("button", { name: /Netflix/ })
    expect(within(netflix).getByText("Streaming")).toBeTruthy()
    expect(within(netflix).queryByText("N")).toBeNull()
    const revista = screen.getByRole("button", { name: /Revista/ })
    expect(within(revista).getByText("R")).toBeTruthy()
    expect(within(revista).getByText("—")).toBeTruthy()
  })

  it("el nombre admite hasta 60 caracteres y el precio no es negativo", () => {
    render(<SubscriptionsCard />)
    fireEvent.click(screen.getByRole("button", { name: "Agregar suscripción" }))
    expect(screen.getByLabelText("Nombre").getAttribute("maxlength")).toBe("60")
    expect(screen.getByLabelText(/Precio/).getAttribute("min")).toBe("0")
  })

  it("el nombre sugiere la categoría; una elegida a mano no cambia", async () => {
    render(<SubscriptionsCard />)
    fireEvent.click(screen.getByRole("button", { name: "Agregar suscripción" }))
    fill("Nombre", "Spotify")
    expect(categoryCombo().textContent).toBe("Streaming")
    expect(screen.getByText("Sugerida por el concepto")).toBeTruthy()
    fill("Nombre", "Algo raro")
    expect(categoryCombo().textContent).not.toContain("Streaming")

    fireEvent.mouseDown(categoryCombo())
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Gimnasio" }))
    fill("Nombre", "Netflix")
    expect(categoryCombo().textContent).toBe("Gimnasio")
    fill(/Precio/, "30")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.saveSubscription).toHaveBeenCalledTimes(1))
    expect(data.saveSubscription.mock.calls[0][0]).toMatchObject({ name: "Netflix", category: "GIMNASIO", price: 30 })
  })
})
