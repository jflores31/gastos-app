import { describe, expect, it } from "vitest"
import type { Theme } from "@mui/material/styles"
import { getTheme } from "@/theme/materialTheme"
import { compareCurrentSx, paletteColor } from "./OverviewTab.styles"

describe("comparación con el período anterior", () => {
  const theme = getTheme("light", "ocean")

  it("paletteColor convierte el nombre del tema en su color; lo que no es del tema queda igual", () => {
    expect(paletteColor(theme, "success.main")).toBe(theme.palette.success.main)
    expect(paletteColor(theme, "primary.main")).toBe(theme.palette.primary.main)
    expect(paletteColor(theme, "#123456")).toBe("#123456")
  })

  it("el brillo de la barra actual usa un color de CSS, no el nombre del tema (que el navegador descartaba)", () => {
    const boxShadow = (compareCurrentSx("error.main", 50) as { boxShadow: (t: Theme) => string }).boxShadow
    expect(boxShadow(theme)).toBe(`0 0 8px ${theme.palette.error.main}`)
    expect(boxShadow(getTheme("dark", "ocean"))).toBe(`0 0 8px ${getTheme("dark", "ocean").palette.error.main}`)
  })
})
