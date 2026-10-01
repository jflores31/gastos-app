// Styles of the Overview tab. Its cards are theme/tokens' liftCardSx and the donut frame comes from
// components/charts; these are the pieces of its own.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Greeting and period chips. */
export const headerRowSx: Sx = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }

/** Balance card. */
export const heroContentSx: Sx = { p: 2.5, color: "text.primary", "&:last-child": { pb: 2.5 } }
export const heroAmountSx = (positive: boolean): Sx => ({
  fontWeight: 800, mt: 1, mb: 1, color: positive ? "success.main" : "error.main", fontSize: { xs: "1.6rem", sm: "3rem" },
})
/** Savings rate and health score, each in its tone. */
export const pillSx = (tone: string): Sx => ({
  px: 2.5, py: 1.5, bgcolor: `${tone}.light`, borderRadius: 2, border: "1px solid", borderColor: `${tone}.main`,
})

/** Income, expense, savings and anomalies cards. */
export const miniContentSx: Sx = { p: 2, "&:last-child": { pb: 2 }, display: "flex", flexDirection: "column", height: "100%" }
/** Top categories inside the income and expense cards. */
export const categoryDotSx = (color: string): Sx => ({ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 })
export const categoryBarSx = (color: string, pct: number): Sx => ({
  height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: 3, transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
})

/** Cash flow legend. */
export const cashflowLegendSx: Sx = { display: "flex", justifyContent: "center", gap: 3, mb: 2, py: 1.5, bgcolor: "action.hover", borderRadius: 2 }
/** A slice of the expense breakdown, next to the donut. */
export const sliceRowSx: Sx = {
  display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1, bgcolor: "action.hover", borderRadius: 2,
  transition: "transform 0.2s, background-color 0.2s", "&:hover": { bgcolor: "action.selected" },
}
/** An insight; every other one is highlighted in green. */
export const insightRowSx = (highlight: boolean): Sx => ({
  display: "flex", gap: 2, p: 2,
  bgcolor: highlight ? "success.light" : "action.hover",
  borderRadius: 3, border: "1px solid",
  borderColor: highlight ? "success.main" : "divider",
  transition: "transform 0.2s, background-color 0.2s", "&:hover": { transform: "translateX(4px)" },
})
export const heatLegendSx: Sx = { display: "flex", alignItems: "center", gap: 1, mt: 2, justifyContent: "center" }

/** Comparison with the previous period: the previous value faded under the current one. */
export const compareTrackSx: Sx = { height: 10, borderRadius: 2, bgcolor: "action.hover", position: "relative", overflow: "hidden" }
export const comparePreviousSx = (color: string, pct: number): Sx => ({
  position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2, bgcolor: color, opacity: 0.2, width: `${pct}%`, transition: "width 0.5s",
})
export const compareCurrentSx = (color: string, pct: number): Sx => ({
  position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2, bgcolor: color, width: `${pct}%`, transition: "width 0.5s",
  boxShadow: `0 0 8px ${color}`,
})
