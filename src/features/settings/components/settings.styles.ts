// Styles of the settings panel: the drawer and its tabs, the profile header and the accent picker.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Full width on phones, 380 px from sm up; the panel scrolls, not the page. */
export const drawerSx: Sx = { "& .MuiDrawer-paper": { width: { xs: "100%", sm: 380 }, p: 0, overflowY: "auto" } }

export const panelHeaderSx: Sx = { p: 2, pb: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center" }

/** Profile / Settings tabs, stuck to the top while the panel scrolls. */
export const panelTabsSx: Sx = {
  position: "sticky", top: 0, zIndex: 2, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", minHeight: 48,
}

/** Profile header on the accent gradient (main → dark of the active accent). */
export const profileHeroSx: Sx = {
  px: 3, pt: 4, pb: 3.5, textAlign: "center", color: "primary.contrastText",
  background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
}

/** Photo or initials, in a translucent white ring over the header. */
export const profileAvatarSx: Sx = {
  width: 78, height: 78, mx: "auto", mb: 1.5,
  bgcolor: "rgba(255,255,255,0.2)", color: "common.white", fontWeight: 800, fontSize: 28,
  border: "3px solid rgba(255,255,255,0.55)", boxShadow: "0 8px 26px rgba(0,0,0,0.22)",
}

export const saveNameButtonSx: Sx = { alignSelf: "flex-end", borderRadius: 2, textTransform: "none", fontWeight: 600, minWidth: 120 }

/** Accent swatch: the accent's gradient; the chosen one gets a ring and a shadow. */
export const accentSwatchSx = (grad: readonly [string, string], selected: boolean): Sx => ({
  width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
  background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
  boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.25)" : "none",
  border: selected ? "3px solid" : "2px solid transparent",
  borderColor: selected ? "text.primary" : "transparent",
  transition: "transform 0.15s, border-color 0.15s",
  "&:hover": { transform: "scale(1.15)" },
})
