// Styles of the calendar filter. `main` is the tab's colour (red for expenses, green for income);
// days and months with movements are tinted with it in proportion to their amount.
import { alpha, type Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** Tint of a cell with `val` out of the period's highest `max`. */
const heat = (main: string, val: number, max: number) => alpha(main, 0.12 + (val / max) * 0.7)

/** The trigger chip once a day or month is picked: filled with the tab's colour. */
export const selectedChipSx = (main: string): Sx => ({
  fontWeight: 600, fontSize: 11, bgcolor: main, color: "#fff", cursor: "pointer",
  "& .MuiChip-icon": { color: "rgba(255,255,255,0.85)" },
  "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.75)", "&:hover": { color: "#fff" } },
})
export const triggerChipSx = (main: string): Sx => ({
  fontWeight: 600, fontSize: 11, borderColor: "divider", color: "text.secondary", cursor: "pointer",
  "&:hover": { borderColor: main, color: main },
})
export const panelSx: Sx = { mt: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, maxWidth: 288 }

/** "Day" / "Month" switch. */
export const modeChipSx = (active: boolean, main: string): Sx => ({
  fontWeight: 600, fontSize: 10, height: 20,
  bgcolor: active ? main : undefined,
  color: active ? "#fff" : "text.secondary",
  borderColor: active ? main : "divider",
  "&:hover": { opacity: 0.85 },
})

/** A day: filled when picked, tinted by its amount, outlined if it's today. */
export const dayCellSx = ({ sel, today, val, max, main }: { sel: boolean; today: boolean; val: number; max: number; main: string }): Sx => ({
  aspectRatio: "1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 0.75,
  cursor: "pointer",
  bgcolor: sel ? main : val > 0 ? heat(main, val, max) : "transparent",
  outline: today && !sel ? `1.5px solid ${main}` : "none",
  outlineOffset: -1,
  color: sel ? "#fff" : "text.primary",
  fontWeight: val > 0 ? 600 : 400,
  fontSize: 10,
  transition: "opacity 0.12s, transform 0.12s, background-color 0.12s",
  userSelect: "none",
  "&:hover": { opacity: 0.75, transform: "scale(1.08)" },
})
export const heatLegendSx: Sx = { display: "flex", alignItems: "center", gap: 0.5, mt: 1, justifyContent: "center" }

/** A month: like a day, with its name and amount. */
export const monthCellSx = ({ sel, current, val, max, main }: { sel: boolean; current: boolean; val: number; max: number; main: string }): Sx => ({
  py: 1, px: 0.25,
  borderRadius: 1,
  cursor: "pointer",
  bgcolor: sel ? main : val > 0 ? heat(main, val, max) : "transparent",
  outline: current && !sel ? `1.5px solid ${main}` : "none",
  outlineOffset: -1,
  textAlign: "center",
  transition: "opacity 0.12s, background-color 0.12s",
  userSelect: "none",
  "&:hover": { opacity: 0.75 },
})
export const monthNameSx = (sel: boolean): Sx => ({ fontWeight: 600, display: "block", color: sel ? "#fff" : "text.primary", fontSize: 10 })
export const monthAmountSx = (sel: boolean, main: string): Sx => ({
  display: "block", color: sel ? "rgba(255,255,255,0.8)" : main, fontWeight: 600, fontSize: 8, lineHeight: 1.2, mt: 0.25,
})
