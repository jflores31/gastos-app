// Styles of the Budget tab's cards. The coloured top border is theme/tokens' accentCardSx, the
// list rows its softRowSx and the donut frame comes from components/charts.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import { accentCardSx } from "@/theme/tokens"
import { donutCenterSx } from "@/components/charts/Charts.styles"

type Sx = SystemStyleObject<Theme>

/** Cards that fill their row and keep a minimum height (distribution, comparison). */
export const tallAccentCardSx = (color: string): Sx => ({ ...(accentCardSx(color) as object), height: "100%", minHeight: 280, display: "flex", flexDirection: "column" })

// Budget cards (BudgetCardsGrid).
/** "Add budget": a dashed tile that fills in on hover. */
export const addBudgetCardSx: Sx = {
  borderRadius: 2, border: "2px dashed", borderColor: "primary.main", bgcolor: "primary.light", height: "100%", minHeight: 180,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.2s, color 0.2s",
  "&:hover": { bgcolor: "primary.main", color: "primary.contrastText" },
}
/** A budget: its category colour on top; tinted when it nears (warning) or passes (error) the limit. */
export const budgetCardSx = ({ color, isOver, isWarning }: { color: string; isOver: boolean; isWarning: boolean }): Sx => ({
  borderRadius: 2,
  border: "1px solid",
  borderColor: isOver ? "error.main" : isWarning ? "warning.main" : "divider",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transform: "translateY(-4px)" },
  borderTop: "4px solid",
  borderTopColor: color,
  bgcolor: isOver ? "error.light" : isWarning ? "warning.light" : "background.paper",
  height: "100%",
  display: "flex",
  flexDirection: "column",
})
export const budgetBarSx: Sx = { height: 10, borderRadius: 5, mb: 1.5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { transition: "transform 0.8s ease-in-out" } }
export const limitInputSx: Sx = { width: 80, "& input": { fontSize: 12, py: 0.5 } }

// Budget vs actual.
export const percentChipSx: Sx = { fontWeight: 700, height: 20, fontSize: 11, minWidth: 46, flexShrink: 0 }
export const usageTrackSx: Sx = { position: "relative", height: 10, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }
/** Spent share of the budget; striped once it's over. */
export const usageBarSx = (pct: number, color: string, isOver: boolean): Sx => ({
  position: "absolute", left: 0, top: 0, height: "100%", width: `${pct * 100}%`, bgcolor: color, borderRadius: 6,
  transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
  backgroundImage: isOver
    ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)"
    : "none",
})
export const totalsRowSx: Sx = {
  mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1,
}

// Distribution.
export const distributionBodySx: Sx = { display: "flex", flex: 1, gap: 3, alignItems: "center", flexDirection: { xs: "column", sm: "row" } }
export const distributionDonutSx: Sx = { position: "relative", width: 180, height: 180, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }
export const distributionCenterSx: Sx = { ...(donutCenterSx(80) as object), boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }
export const distributionRowSx: Sx = { display: "flex", alignItems: "center", gap: 1.5, mb: 1, p: 1, borderRadius: 1.5, bgcolor: "action.hover", cursor: "default" }
export const distributionLabelSx: Sx = { flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

// Health summary.
export const gaugePanelSx: Sx = { display: "flex", flexDirection: "column", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 3 }
export const gaugeScoreSx = (tone: string): Sx => ({
  fontWeight: 800, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, 20%)", color: tone + ".main",
})
/** The gauge fills its 120×72 box; its arc strokes in currentColor, so `color` paints it. */
export const gaugeSvgSx: Sx = { width: "100%", height: "100%" }
export const gaugeArcSx = (tone: string): Sx => ({
  color: tone === "success" ? "var(--income)" : tone === "warning" ? "#F9A825" : "var(--expense)",
})
export const healthStatSx: Sx = { p: 2, bgcolor: "action.hover", borderRadius: 2, border: "1px solid", borderColor: "divider" }

// Period comparison.
export const comparisonPanelSx: Sx = {
  flex: 1, p: 2.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center",
}
