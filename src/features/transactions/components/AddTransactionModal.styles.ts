// Styles of the add/edit transaction dialog.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** Group header of the category list (Income, Expense, mine). The income / expense switch is
 * typeToggleSx, in theme/tokens.ts, since the category dialog uses it too. */
export const groupHeaderSx: SystemStyleObject<Theme> = { px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.75, bgcolor: "action.hover", fontWeight: 600 }
