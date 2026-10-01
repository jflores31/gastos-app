// Styles of the accounts card.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Colour of a new account (it can be changed in its dialog). */
export const NEW_ACCOUNT_COLOR = "#0033A0"

/** Total balance, on the primary colour. */
export const balanceHeroSx: Sx = { bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, p: 3, mb: 3 }
/** A transfer in the recent list. */
export const transferRowSx: Sx = { display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: "action.hover", borderRadius: 2 }
