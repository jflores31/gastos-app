// Styles of the goals feature: goals, net worth evolution and forecast. The section card is
// theme/tokens' accentCardSx and the total at the foot its summaryBarSx.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Colour of a new goal (it can be changed in its dialog). */
export const NEW_GOAL_COLOR = "#7ab87a"

// Goals.
/** A goal: outlined, lifts on hover. */
export const goalCardSx: Sx = {
  borderRadius: 2, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
  "&:hover": { boxShadow: 2, transform: "translateY(-2px)" }, minHeight: 160, display: "flex", flexDirection: "column",
}
export const goalContentSx: Sx = { p: 2.5, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2.5 } }
/** The goal's icon on a tint of its colour. */
export const goalIconSx = (color: string): Sx => ({
  width: 44, height: 44, borderRadius: 2, bgcolor: `${color}20`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700,
})
export const goalProgressSx = (color: string): Sx => ({
  height: 8, borderRadius: 4, mb: 1.5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
})

// Net worth evolution: one bar per month; the last one, in full colour.
export const monthColumnSx: Sx = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }
export const monthTrackSx: Sx = { width: "100%", height: 100, bgcolor: "action.hover", borderRadius: 1, position: "relative", overflow: "hidden" }
export const monthBarSx = ({ value, max, isLast }: { value: number; max: number; isLast: boolean }): Sx => ({
  position: "absolute", bottom: 0, width: "100%", height: `${(Math.abs(value) / max) * 100}%`,
  bgcolor: value >= 0 ? (isLast ? "success.main" : "success.light") : "error.light",
  borderRadius: 1, transition: "transform 0.3s, box-shadow 0.3s",
})

// Forecast.
/** A note on a tint of info, with a bar on its left. */
export const infoNoteSx: Sx = { p: 2, bgcolor: "info.light", borderRadius: 2, borderLeft: 4, borderColor: "info.main" }
export const forecastTrackSx: Sx = { flex: 1, height: 12, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }
