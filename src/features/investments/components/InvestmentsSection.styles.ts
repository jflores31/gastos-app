// Styles of the investments section.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** An investment: outlined, a shadow on hover. */
export const investmentCardSx: SystemStyleObject<Theme> = { borderRadius: 2, p: 2, cursor: "pointer", "&:hover": { boxShadow: 1 } }
