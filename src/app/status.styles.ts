// Styles of the 404 and error pages.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** Full-height column, centred. */
export const statusPageSx: SystemStyleObject<Theme> = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 2, p: 3,
}
