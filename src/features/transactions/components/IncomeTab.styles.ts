// Styles of the Income tab.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import { liftCardSx } from "@/theme/tokens"

type Sx = SystemStyleObject<Theme>

/** The total card at the top. */
export const heroCardSx = liftCardSx("success.main", { top: 4, lift: 2, paper: true })
export const heroAddButtonSx: Sx = {
  bgcolor: "success.light", color: "success.dark", transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s",
  "&:hover": { bgcolor: "success.main", color: "success.contrastText", transform: "scale(1.05)" },
}

/** One income source: tinted with its category colour when it's the chosen filter. */
export const sourceRowSx = (isActive: boolean, color: string): Sx => ({
  p: 1.5, borderRadius: 2, border: "1px solid", cursor: "pointer",
  borderColor: isActive ? color : "divider",
  bgcolor: isActive ? `${color}12` : "action.hover",
  transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s",
  "&:hover": { bgcolor: `${color}18`, borderColor: color },
})
export const percentChipSx = (color: string): Sx => ({ bgcolor: color, color: "#fff", fontWeight: 700, fontSize: 10, height: 20 })
export const sourceAddButtonSx = (color: string): Sx => ({
  width: 28, height: 28, bgcolor: color, color: "#fff", flexShrink: 0, "&:hover": { bgcolor: color, opacity: 0.85 },
})
export const barFillSx = (color: string, pct: number): Sx => ({
  height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: 4, transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
})

/** Breakdown and trend cards: resting shadow, deeper on hover. */
export const sideCardSx = (color: string) =>
  liftCardSx(color, { shadow: { rest: "0 4px 20px rgba(0,0,0,0.08)", hover: "0 8px 32px rgba(0,0,0,0.12)" } })

export const legendRowSx: Sx = {
  display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1, bgcolor: "action.hover", borderRadius: 2,
  transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s", "&:hover": { bgcolor: "action.selected" },
}
export const trendLegendSx: Sx = {
  display: "flex", justifyContent: "center", gap: 2, mb: 2, py: 1.5, bgcolor: "action.hover", borderRadius: 2, flexWrap: "wrap",
}
