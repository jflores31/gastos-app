// Design values shared by several features. Components import them instead of repeating the
// literal, so a shadow or a card style changes in one place. A screen's own styles go in a
// *.styles.ts file next to its component.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

export const shadows = {
  /** Budget tab cards, and the cards of Expenses and Income. */
  card: "0 4px 16px rgba(0,0,0,0.08)",
  /** Goals tab sections and the budget health summary. */
  section: "0 8px 32px rgba(0,0,0,0.1)",
} as const

/**
 * Card with a coloured top border: `section` (4 px, deeper shadow) for the Goals tab blocks and
 * the budget health summary, `card` (3 px) for the Budget tab cards. `color` is a palette path
 * such as "success.main". borderTopColor goes after the borderTop shorthand, which resets it.
 */
export function accentCardSx(color: string, kind: keyof typeof shadows = "card"): SystemStyleObject<Theme> {
  return {
    borderRadius: 2,
    boxShadow: shadows[kind],
    borderTop: kind === "section" ? "4px solid" : "3px solid",
    borderTopColor: color,
  }
}

/**
 * Card with a 1 px border that lifts on hover, and a coloured top border (Overview and Income).
 * `paper` paints the background, `shadow` adds a resting shadow and a deeper one on hover. The
 * border shorthands go in order (border, borderColor, borderTop, borderTopColor), since each one
 * resets the colour the previous one set.
 */
export function liftCardSx(
  color: string,
  { top = 3, lift = 4, paper = false, shadow }: { top?: number; lift?: number; paper?: boolean; shadow?: { rest: string; hover: string } } = {},
): SystemStyleObject<Theme> {
  return {
    ...(paper ? { bgcolor: "background.paper" } : {}),
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
    ...(shadow ? { boxShadow: shadow.rest } : {}),
    transition: "transform 0.3s, box-shadow 0.3s",
    "&:hover": shadow ? { boxShadow: shadow.hover, transform: `translateY(-${lift}px)` } : { transform: `translateY(-${lift}px)` },
    borderTop: `${top}px solid`,
    borderTopColor: color,
  }
}

/**
 * MUI zeroes the padding-top of a DialogContent that follows a DialogTitle. "&&" (double
 * specificity) puts `pt` back, so the first field's floating label isn't cut off.
 */
export function dialogTopPaddingSx(pt: number): SystemStyleObject<Theme> {
  return { "&&": { pt } }
}

/** DialogContent as a column of fields, with its padding-top back (see dialogTopPaddingSx). */
export function dialogColumnSx(gap: number, pt: number): SystemStyleObject<Theme> {
  return { display: "flex", flexDirection: "column", gap, ...dialogTopPaddingSx(pt) }
}

/** Round "+" in a section header, tinted with the section colour; filled on hover. */
export function tintedIconButtonSx(color: string): SystemStyleObject<Theme> {
  return { bgcolor: `${color}.light`, "&:hover": { bgcolor: `${color}.main`, color: "common.white" } }
}

/** Row of a list on a soft background (recurring and upcoming payments, accounts, subscriptions). */
export function softRowSx(gap: number): SystemStyleObject<Theme> {
  return { display: "flex", alignItems: "center", gap, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }
}

/** Total at the foot of a section (net worth, investments), on a tint of its colour. */
export function summaryBarSx(color: string): SystemStyleObject<Theme> {
  return { mt: 2, display: "flex", justifyContent: "space-between", p: 2, bgcolor: `${color}.light`, borderRadius: 2 }
}
