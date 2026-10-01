// Styles of the password recovery page: sky blue accent.
import {
  type PageStyles, authPageSx, badgeGlow, blobSx, darkFieldSx, darkOutlinedSx, iconBadgeSx, submitButtonSx,
} from "./auth.styles"

const SKY = "56,189,248"

export const forgotStyles = (isDark: boolean) => ({
  page: authPageSx(isDark),
  blobs: [
    blobSx(isDark, { at: { top: "-20%", left: "-10%" }, size: 580, rgb: SKY, alpha: [0.18, 0.08] }),
    blobSx(isDark, { at: { bottom: "-18%", right: "-8%" }, size: 500, rgb: "99,102,241", alpha: [0.13, 0.06] }),
    blobSx(isDark, { at: { top: "55%", right: "28%" }, size: 280, rgb: "14,165,233", alpha: [0.09, 0.05], fade: 70 }),
  ],
  cardAccent: "rgba(56,189,248,0.10)",
  badge: {
    ...iconBadgeSx(70, "18px", "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)", badgeGlow(SKY, 10, 0.35)),
    mb: 3,
  },
  successBadge: {
    ...iconBadgeSx(72, "50%", "linear-gradient(135deg, #38bdf8, #0284c7)", badgeGlow(SKY, 12, 0.35)),
    mx: "auto",
    mb: 3,
  },
  sentTo: { fontWeight: 700, mb: 3.5, wordBreak: "break-all", color: isDark ? "#7dd3fc" : "primary.main" },
  backButton: {
    py: 1.4, borderRadius: "10px", fontWeight: 700, fontSize: 14.5, textTransform: "none",
    ...darkOutlinedSx(isDark),
    transition: "background-color 0.18s, border-color 0.18s, color 0.18s",
  },
  field: darkFieldSx(isDark, { accent: "#38bdf8", labelAccent: "#7dd3fc" }),
  submit: submitButtonSx({
    gradient: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)",
    hover: "linear-gradient(90deg, #7dd3fc 0%, #38bdf8 100%)",
    rgb: SKY,
    shadow: [0.38, 0.5],
  }),
}) satisfies PageStyles
