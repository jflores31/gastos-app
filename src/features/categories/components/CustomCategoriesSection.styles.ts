// Styles of "Mis categorías": the list rows and the colour picker of the dialog.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Colours offered for a custom category. */
export const COLOR_PRESETS = ["#e74c3c", "#e67e22", "#f39c12", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#e91e63", "#607d8b", "#9e9e9e"]

/** A new category starts grey, the last preset. */
export const NEW_CATEGORY_COLOR = "#9e9e9e"

export const categoryRowSx: Sx = { display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: "action.hover" }

/** Colour swatch; the chosen one gets a ring. */
export const colorSwatchSx = (color: string, selected: boolean): Sx => ({
  width: 32, height: 32, borderRadius: "50%", bgcolor: color, cursor: "pointer",
  border: selected ? "3px solid" : "2px solid transparent",
  borderColor: selected ? "text.primary" : "transparent",
  transition: "transform 0.15s",
  "&:hover": { transform: "scale(1.2)" },
})
