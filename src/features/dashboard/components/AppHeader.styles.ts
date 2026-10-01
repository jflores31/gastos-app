// Styles of the app header.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import { accentGradient } from "@/theme/materialTheme"

type Sx = SystemStyleObject<Theme>

/** The logo mark. */
export const logoMarkSx: Sx = {
  width: 32, height: 32, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText",
  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16,
}
/** "+": the accent gradient; its icon turns on hover. */
export const addFabSx: Sx = {
  boxShadow: 2, minWidth: 44, minHeight: 44,
  background: (th) => accentGradient(th),
  color: "#fff",
  "&:hover": { background: (th) => accentGradient(th, 145), filter: "brightness(1.05)" },
  "&:hover .MuiSvgIcon-root": { transform: "rotate(90deg)" },
}
export const settingsFabSx: Sx = { boxShadow: 1, minWidth: 44, minHeight: 44, "&:hover .MuiSvgIcon-root": { transform: "rotate(90deg)" } }
/** The user's avatar: a ring in the accent on hover. */
export const avatarSx: Sx = {
  width: 32, height: 32, bgcolor: "primary.main", fontSize: 14, fontWeight: 700, cursor: "pointer",
  "&:hover": { boxShadow: "0 0 0 2px var(--accent)" }, transition: "box-shadow 0.15s",
}
