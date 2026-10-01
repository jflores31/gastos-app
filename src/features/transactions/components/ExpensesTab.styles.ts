// Styles of the Expenses tab.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** "Today" card: its header is a band in the primary colour. */
export const dailyCardSx: Sx = { borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }
export const dailyHeaderSx: Sx = {
  px: { xs: 2, sm: 3 }, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
  bgcolor: "primary.main", color: "primary.contrastText",
}
export const dailyAddButtonSx: Sx = {
  bgcolor: "rgba(255,255,255,0.15)", color: "inherit", transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s",
  "&:hover": { bgcolor: "rgba(255,255,255,0.25)", transform: "scale(1.05)" },
}
export const sectionToggleSx: Sx = { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, cursor: "pointer" }
export const todayTotalSx: Sx = { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, p: 1.5, bgcolor: "primary.light", borderRadius: 2 }
export const todayRowSx: Sx = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }

/** The three cards (top categories, budget vs actual, summary), with a coloured top border. */
export const panelCardSx = (color: string): Sx => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  borderTop: "3px solid",
  borderTopColor: color,
})
export const panelContentSx: Sx = { py: 2.5, px: { xs: 2, sm: 3 }, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }

/** A row inside those cards: tinted, bordered, grows a little on hover. */
export const panelItemSx = (bgcolor: string, borderColor = "divider", opacity?: number): Sx => ({
  borderRadius: 2, p: 2, bgcolor, border: "1px solid", borderColor,
  transition: "transform 0.2s, background-color 0.2s, box-shadow 0.2s",
  ...(opacity === undefined ? {} : { opacity }),
  "&:hover": { transform: "scale(1.01)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
})
