// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { IconPicker } from "./IconPicker.jsx"
import { ICON_CHOICES } from "./categoryIcons.js"

describe("IconPicker", () => {
  afterEach(cleanup)

  it("muestra una opción por cada icono elegible y marca la seleccionada", () => {
    render(<IconPicker label="Icono" value="Flight" onChange={() => {}} />)
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(Object.keys(ICON_CHOICES).length)
    expect(screen.getByRole("radio", { name: "Flight" }).getAttribute("aria-checked")).toBe("true")
    expect(screen.getByRole("radio", { name: "Pets" }).getAttribute("aria-checked")).toBe("false")
  })

  it("devuelve la clave del icono al elegirlo", () => {
    const onChange = vi.fn()
    render(<IconPicker label="Icono" value="Flight" onChange={onChange} />)
    fireEvent.click(screen.getByRole("radio", { name: "Pets" }))
    expect(onChange).toHaveBeenCalledWith("Pets")
  })

  it("un glifo viejo (texto libre) no marca ninguna opción", () => {
    render(<IconPicker label="Icono" value="◉" onChange={() => {}} />)
    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true)
  })
})
