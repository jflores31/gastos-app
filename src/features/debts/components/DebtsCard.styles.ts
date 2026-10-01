// Styles of the debts card.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

export const debtRowSx: Sx = { mb: 2, p: 2, bgcolor: "action.hover", borderRadius: 2, cursor: "pointer" }
/** How much is paid, in red. */
export const debtProgressSx: Sx = { height: 6, borderRadius: 3, mb: 0.5, bgcolor: "action.selected", "& .MuiLinearProgress-bar": { bgcolor: "error.main" } }
