// Styles of the 404 page.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** Full-height column, centred. */
export const notFoundPageSx: SystemStyleObject<Theme> = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 2, p: 3,
}
