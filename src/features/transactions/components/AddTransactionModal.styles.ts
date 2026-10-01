// Styles of the add/edit transaction dialog.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Income / expense switch, each in its colour. */
export const typeToggleSx = (color: "success" | "error"): Sx => ({
  fontWeight: 600, color: `${color}.main`, "&.Mui-selected": { bgcolor: `${color}.light`, color: `${color}.dark` },
})

/** Group header of the category list (Income, Expense, mine). */
export const groupHeaderSx: Sx = { px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.75, bgcolor: "action.hover", fontWeight: 600 }
