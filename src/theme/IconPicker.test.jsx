// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { IconPicker } from "./IconPicker.jsx"
import { ICON_CHOICES } from "./categoryIcons.js"
import { MESSAGES } from "../i18n/index.js"

vi.mock("../context/SettingsContext.jsx", () => ({ useSettings: () => ({ t: MESSAGES.es }) }))

describe("IconPicker", () => {
  afterEach(cleanup)

  it("muestra una opción por cada icono elegible, con su nombre en el idioma, y marca la seleccionada", () => {
    render(<IconPicker label="Icono" value="Flight" onChange={() => {}} />)
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(Object.keys(ICON_CHOICES).length)
    expect(screen.getByRole("radio", { name: "Avión" }).getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("radio", { name: "Mascotas" }).getAttribute("aria-checked")).toBe("false")
  })

  it("devuelve la clave del icono al elegirlo", () => {
    const onChange = vi.fn()
    render(<IconPicker label="Icono" value="Flight" onChange={onChange} />)
    fireEvent.click(screen.getByRole("radio", { name: "Mascotas" }))
    expect(onChange).toHaveBeenCalledWith("Pets")
  })

  it("un glifo viejo (texto libre) no marca ninguna opción", () => {
    render(<IconPicker label="Icono" value="◉" onChange={() => {}} />)
    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true)
  })
})
