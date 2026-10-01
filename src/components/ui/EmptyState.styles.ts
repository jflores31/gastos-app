// Styles of the empty state.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** Centred column with room around it. */
export const emptyStateSx: SystemStyleObject<Theme> = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, px: 3, textAlign: "center",
}
