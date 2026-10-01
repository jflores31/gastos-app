// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react"
import { MESSAGES } from "@/i18n"
import { AccountsCard } from "./AccountsCard"
import { TransferDialog } from "./TransferDialog"

// Settings and data come from stubs: the tests choose the accounts and inspect what is saved.
const settings = { current: { t: MESSAGES.es, lang: "es", currency: "PEN", fmt: (v) => `S/${v}` } }
const data = {}
vi.mock("@/contexts/SettingsContext", () => ({ useSettings: () => settings.current }))
vi.mock("@/contexts/DataContext", () => ({ useData: () => data }))

const at = new Date("2026-09-10T12:00:00Z")
const worth = { net: 0, assets: 0, debt: 0 }
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const pick = (combo, option) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: combo }))
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }))
}

describe("AccountsCard — saldo de hoy", () => {
  beforeEach(() => {
    settings.current = { t: MESSAGES.es, lang: "es", currency: "PEN", fmt: (v) => `S/${v}` }
    Object.assign(data, {
      accounts: [{ id: "bcp", name: "BCP", type: "bank", balance: 1000, balanceAt: at, current: 785, color: "#123456" }],
      transfers: [],
      saveAccount: vi.fn(() => Promise.resolve()),
      deleteAccount: vi.fn(),
      deleteTransfer: vi.fn(),
    })
  })
  afterEach(cleanup)

  it("muestra el saldo de hoy y, al editar sin tocarlo, conserva el saldo guardado y su fecha", async () => {
    render(<AccountsCard worth={worth} />)
    expect(screen.getByText("+S/785")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    expect(screen.getByLabelText("Saldo").value).toBe("785")
    fill("Nombre", "BCP soles")
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.saveAccount).toHaveBeenCalledTimes(1))
    expect(data.saveAccount.mock.calls[0][0]).toMatchObject({ id: "bcp", name: "BCP soles", balance: 1000, balanceAt: at })
  })

  it("el nombre de la cuenta admite hasta 60 caracteres", () => {
    render(<AccountsCard worth={worth} />)
    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    expect(screen.getByLabelText("Nombre").getAttribute("maxlength")).toBe("60")
  })

  it("un saldo escrito es el de hoy: reemplaza al guardado, con la fecha de ahora", async () => {
    render(<AccountsCard worth={worth} />)
    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    fill("Saldo", "700")
    const before = Date.now()
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(data.saveAccount).toHaveBeenCalledTimes(1))
    const saved = data.saveAccount.mock.calls[0][0]
    expect(saved.balance).toBe(700)
    expect(saved.balanceAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it("transferir necesita dos cuentas; la lista muestra las últimas, con la cuenta borrada", () => {
    render(<AccountsCard worth={worth} />)
    expect(screen.getByRole("button", { name: "Nueva transferencia" }).disabled).toBe(true)
    cleanup()
    data.accounts = [...data.accounts, { id: "cash", name: "Efectivo", type: "cash", balance: 50, current: 250, color: "#7ab87a" }]
    data.transfers = [
      { id: "tr1", origen: "bcp", destino: "cash", monto: 200, date: new Date("2026-09-12T12:00:00Z"), nota: "retiro" },
      { id: "tr0", origen: null, destino: "cash", monto: 10, date: new Date("2026-09-11T12:00:00Z"), nota: null },
    ]
    render(<AccountsCard worth={worth} />)
    expect(screen.getByRole("button", { name: "Nueva transferencia" }).disabled).toBe(false)
    const list = within(screen.getByRole("region", { name: "Transferencias" }))
    expect(list.getAllByText(/→/).map((n) => n.textContent)).toEqual(["BCP → Efectivo", "(cuenta borrada) → Efectivo"])
    expect(list.getByRole("button", { name: "Eliminar transferencia BCP → Efectivo" })).toBeTruthy()
  })
})

describe("TransferDialog", () => {
  beforeEach(() => {
    settings.current = { t: MESSAGES.es, lang: "es", currency: "USD", fmt: (v) => `S/${v}` }
    Object.assign(data, {
      accounts: [
        { id: "bcp", name: "BCP", balance: 1000, current: 1000 },
        { id: "cash", name: "Efectivo", balance: 50, current: 50 },
      ],
      saveTransfer: vi.fn(() => Promise.resolve()),
    })
  })
  afterEach(cleanup)

  it("guarda el monto en PEN entre las dos cuentas elegidas, con nota opcional", async () => {
    const onClose = vi.fn()
    render(<TransferDialog onClose={onClose} />)
    fill(/Monto/, "27") // USD → PEN a 0.27
    fill(/Nota/, "  retiro  ")
    fireEvent.click(screen.getByRole("button", { name: "Transferir" }))
    await waitFor(() => expect(data.saveTransfer).toHaveBeenCalledTimes(1))
    expect(data.saveTransfer.mock.calls[0][0]).toMatchObject({ origen: "bcp", destino: "cash", monto: 100, nota: "retiro" })
    expect(data.saveTransfer.mock.calls[0][0].date).toBeInstanceOf(Date)
    expect(onClose).toHaveBeenCalled()
  })

  it("no deja transferir a la misma cuenta ni sin monto", () => {
    render(<TransferDialog onClose={vi.fn()} />)
    const button = screen.getByRole("button", { name: "Transferir" })
    expect(button.disabled).toBe(true) // sin monto
    fill(/Monto/, "10")
    expect(button.disabled).toBe(false)
    pick("Hacia", /^BCP/)
    expect(screen.getByText("Elige dos cuentas distintas")).toBeTruthy()
    expect(button.disabled).toBe(true)
  })
})
