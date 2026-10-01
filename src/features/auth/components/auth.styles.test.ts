import { describe, expect, it } from "vitest"
import { authPageSx, badgeGlow, blobSx, mutedColor, submitButtonSx, titleColor } from "./auth.styles"

// The helpers build the same CSS text the pages had written out by hand.
describe("auth.styles", () => {
  it("blobSx: the radial gradient with the alpha of each theme", () => {
    const blob = { at: { top: "-20%", left: "-12%" }, size: 650, rgb: "99,102,241", alpha: [0.22, 0.09] as [number, number] }
    expect(blobSx(true, blob)).toMatchObject({ top: "-20%", left: "-12%", width: 650, background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 68%)" })
    expect(blobSx(false, { ...blob, fade: 70 })).toMatchObject({ background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)" })
  })

  it("badgeGlow and submitButtonSx: the glow strings", () => {
    expect(badgeGlow("34,197,94", 12, 0.35)).toBe("0 0 0 12px rgba(34,197,94,0.1), 0 14px 40px rgba(34,197,94,0.35)")
    expect(submitButtonSx({ gradient: "g", hover: "h", rgb: "56,189,248", shadow: [0.38, 0.5] })).toMatchObject({
      boxShadow: "0 4px 22px rgba(56,189,248,0.38)",
      "&:hover:not(:disabled)": { background: "h", boxShadow: "0 6px 30px rgba(56,189,248,0.5)" },
      "&:disabled": { background: "rgba(56,189,248,0.3)", color: "rgba(255,255,255,0.38)" },
    })
  })

  it("dark look vs the theme in light", () => {
    expect(authPageSx(true)).toMatchObject({ bgcolor: "#07080f", p: { xs: 2, sm: 3 } })
    expect(authPageSx(false, 3)).toMatchObject({ bgcolor: "background.default", p: 3 })
    expect([titleColor(true), titleColor(false)]).toEqual(["#f1f5f9", "text.primary"])
    expect([mutedColor(true, 0.32), mutedColor(false, 0.32)]).toEqual(["rgba(255,255,255,0.32)", "text.secondary"])
  })
})
