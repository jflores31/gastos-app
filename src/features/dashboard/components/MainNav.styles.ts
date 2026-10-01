// Styles of the main navigation.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** The bottom bar on mobile: fixed, above the content, with a top divider. */
export const bottomNavSx: SystemStyleObject<Theme> = {
  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: 1, borderColor: "divider",
}
