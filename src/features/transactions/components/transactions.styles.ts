// Styles both transaction tabs (Expenses and Income) share: the header of the transactions list
// and the total footer, in the tab's colour ("primary" or "success").
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>
type Spacing = number | { xs: number; sm: number }

/** Title row of the transactions list, underlined in the tab's colour. */
export const listHeaderSx = (color: string): Sx => ({
  display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, pb: 2,
  borderBottom: "2px solid", borderColor: `${color}.main`,
})

/** The calendar filter, to the right of the title. */
export const listHeaderActionsSx: Sx = { display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }

/** Total of the list, on the tab's colour. pt goes before py, which then sets it again. */
export const totalFooterSx = (color: string, px: Spacing): Sx => ({
  mt: 2, pt: 2, borderTop: "2px solid", borderColor: `${color}.main`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
  bgcolor: `${color}.main`, color: `${color}.contrastText`, borderRadius: 2, px, py: 2,
})

/** A row of TransactionList. */
export const txRowSx: Sx = { py: 1, borderBottom: 1, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }
