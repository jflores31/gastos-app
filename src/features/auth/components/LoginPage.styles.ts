// Styles of the login page: indigo accent.
import {
  type PageStyles, authPageSx, badgeGlow, blobSx, darkFieldSx, iconBadgeSx, submitButtonSx,
} from "./auth.styles"

const INDIGO = "99,102,241"

export const loginStyles = (isDark: boolean) => ({
  page: authPageSx(isDark),
  blobs: [
    blobSx(isDark, { at: { top: "-20%", left: "-12%" }, size: 650, rgb: INDIGO, alpha: [0.22, 0.09] }),
    blobSx(isDark, { at: { bottom: "-18%", right: "-8%" }, size: 550, rgb: "34,197,94", alpha: [0.14, 0.07] }),
    blobSx(isDark, { at: { top: "52%", right: "22%" }, size: 320, rgb: "139,92,246", alpha: [0.11, 0.06], fade: 70 }),
  ],
  cardAccent: "rgba(99,102,241,0.10)",
  badge: {
    ...iconBadgeSx(70, "18px", "linear-gradient(135deg, #6366f1 0%, #22c55e 100%)", badgeGlow(INDIGO, 10, 0.35)),
    mx: "auto",
    mb: 2.5,
  },
  field: darkFieldSx(isDark, { accent: "#6366f1", labelAccent: "#a5b4fc" }),
  mfaButton: { py: 1.4, borderRadius: "10px", fontWeight: 700, textTransform: "none", mb: 1.5 },
  forgotLink: {
    fontWeight: 500,
    color: isDark ? "rgba(165,180,252,0.75)" : "primary.main",
    "&:hover": { color: isDark ? "#a5b4fc" : "primary.dark" },
    transition: "color 0.15s",
  },
  submit: {
    ...submitButtonSx({
      gradient: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)",
      hover: "linear-gradient(90deg, #818cf8 0%, #6366f1 100%)",
      rgb: INDIGO,
      shadow: [0.42, 0.55],
    }),
    mb: 3.5,
  },
  signupLink: {
    fontWeight: 700, fontSize: 13,
    color: isDark ? "#a5b4fc" : "primary.main",
    "&:hover": { color: isDark ? "#818cf8" : "primary.dark" },
    transition: "color 0.15s",
  },
}) satisfies PageStyles
