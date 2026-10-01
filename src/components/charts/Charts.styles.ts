// Frame of the donut charts (Overview, Income, Budget): a tinted ring around the donut and a disc
// at its centre for the total.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

export const donutRingSx = (size: number): Sx => ({
  position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
  bgcolor: "action.hover", borderRadius: "50%",
})

export const donutCenterSx = (size: number): Sx => ({
  position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%",
  width: size, height: size, display: "flex", flexDirection: "column", justifyContent: "center",
})
