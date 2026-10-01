import { describe, expect, it } from "vitest"
import { accentCardSx, dialogColumnSx, dialogTopPaddingSx, liftCardSx, shadows } from "./tokens"

describe("accentCardSx", () => {
  it("card: 3 px border and the card shadow; section: 4 px and the section shadow", () => {
    expect(accentCardSx("info.main")).toEqual({ borderRadius: 2, boxShadow: shadows.card, borderTop: "3px solid", borderTopColor: "info.main" })
    expect(accentCardSx("success.main", "section")).toEqual({ borderRadius: 2, boxShadow: shadows.section, borderTop: "4px solid", borderTopColor: "success.main" })
  })

  it("borderTopColor comes after the borderTop shorthand, which would reset it", () => {
    const keys = Object.keys(accentCardSx("primary.main") as object)
    expect(keys.indexOf("borderTopColor")).toBeGreaterThan(keys.indexOf("borderTop"))
  })
})

describe("liftCardSx", () => {
  it("defaults: 3 px top border, lifts 4 px; options add the paper, the shadows and the size", () => {
    expect(liftCardSx("info.main")).toEqual({
      borderRadius: 2, border: "1px solid", borderColor: "divider", transition: "transform 0.3s, box-shadow 0.3s",
      "&:hover": { transform: "translateY(-4px)" }, borderTop: "3px solid", borderTopColor: "info.main",
    })
    expect(liftCardSx("success.main", { top: 4, lift: 2, paper: true })).toMatchObject({ bgcolor: "background.paper", "&:hover": { transform: "translateY(-2px)" }, borderTop: "4px solid" })
    expect(liftCardSx("warning.main", { shadow: { rest: "a", hover: "b" } })).toMatchObject({ boxShadow: "a", "&:hover": { boxShadow: "b", transform: "translateY(-4px)" } })
  })

  it("the border shorthands keep their order, so the top colour isn't reset", () => {
    const keys = Object.keys(liftCardSx("x", { paper: true, shadow: { rest: "a", hover: "b" } }) as object)
    const at = (k: string) => keys.indexOf(k)
    expect(at("border")).toBeLessThan(at("borderColor"))
    expect(at("borderColor")).toBeLessThan(at("borderTop"))
    expect(at("borderTop")).toBeLessThan(at("borderTopColor"))
  })
})

describe("dialog content", () => {
  it("puts the padding-top back with double specificity, alone or in a column of fields", () => {
    expect(dialogTopPaddingSx(0)).toEqual({ "&&": { pt: 0 } })
    expect(dialogColumnSx(2.5, 1)).toEqual({ display: "flex", flexDirection: "column", gap: 2.5, "&&": { pt: 1 } })
  })
})
