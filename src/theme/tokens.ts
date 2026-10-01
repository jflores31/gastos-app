// Design values shared by several features. Components import them instead of repeating the
// literal, so a shadow or a card style changes in one place. A screen's own styles go in a
// *.styles.ts file next to its component.

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
export function accentCardSx(color: string, kind: keyof typeof shadows = "card") {
  return {
    borderRadius: 2,
    boxShadow: shadows[kind],
    borderTop: kind === "section" ? "4px solid" : "3px solid",
    borderTopColor: color,
  }
}
