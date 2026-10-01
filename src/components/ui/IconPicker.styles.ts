// Styles of the icon picker.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import { tint } from "@/theme/iconTones"

type Sx = SystemStyleObject<Theme>

/** Colour of the selected icon when the form has none: the base of the neutral tone (theme/iconTones). */
export const DEFAULT_ICON_COLOR = "#7C8CA1"

/** As many 40 px columns as fit; scrolls past 180 px. */
export const iconGridSx: Sx = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
  gap: 0.75,
  maxHeight: 180,
  overflowY: "auto",
  p: 0.5,
}

/** One icon; the selected one takes the form's colour, on a tint of it. */
export const iconChoiceSx = (selected: boolean, color: string): Sx => ({
  width: 40,
  height: 40,
  borderRadius: "30%",
  border: "1.5px solid",
  borderColor: selected ? color : "divider",
  bgcolor: selected ? tint(color, 0.16) : "transparent",
  color: selected ? color : "text.secondary",
})
