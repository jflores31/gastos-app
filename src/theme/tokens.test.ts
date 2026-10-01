import { describe, expect, it } from "vitest"
import { accentCardSx, shadows } from "./tokens"

describe("accentCardSx", () => {
  it("card: 3 px border and the card shadow; section: 4 px and the section shadow", () => {
    expect(accentCardSx("info.main")).toEqual({ borderRadius: 2, boxShadow: shadows.card, borderTop: "3px solid", borderTopColor: "info.main" })
    expect(accentCardSx("success.main", "section")).toEqual({ borderRadius: 2, boxShadow: shadows.section, borderTop: "4px solid", borderTopColor: "success.main" })
  })

  it("borderTopColor comes after the borderTop shorthand, which would reset it", () => {
    const keys = Object.keys(accentCardSx("primary.main"))
    expect(keys.indexOf("borderTopColor")).toBeGreaterThan(keys.indexOf("borderTop"))
  })
})
