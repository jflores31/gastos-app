// Styles of the in-app login dialog.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** The app's initial in a circle, above the form. */
export const brandAvatarSx: Sx = {
  width: 64, height: 64, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 28, fontWeight: 700, mx: "auto", mb: 2,
}
