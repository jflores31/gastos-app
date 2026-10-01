// Styles of the charts. The SVGs drawn by Charts.tsx size themselves with the st-spark and
// st-flow-svg classes of globals.css; the donut, whose maximum is its own size, with donutSvgSx.
// The donut's frame (Overview, Income, Budget): a tinted ring around it and a disc at its centre
// for the total.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Fills its box up to its own size, keeping the aspect ratio. */
export const donutSvgSx = (size: number): Sx => ({ width: "100%", height: "auto", maxWidth: size })

export const donutRingSx = (size: number): Sx => ({
  position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
  bgcolor: "action.hover", borderRadius: "50%",
})

export const donutCenterSx = (size: number): Sx => ({
  position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%",
  width: size, height: size, display: "flex", flexDirection: "column", justifyContent: "center",
})
