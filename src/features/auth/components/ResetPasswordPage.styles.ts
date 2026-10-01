// Styles of the reset password page: amber accent; red for an expired link, green on success.
import {
  type PageStyles, authDark, authPageSx, badgeGlow, blobSx, ctaButtonSx, darkFieldSx, iconBadgeSx, mutedColor,
  submitButtonSx,
} from "./auth.styles"

const AMBER = "245,158,11"
const RED = "239,68,68"
const GREEN = "34,197,94"

export const resetStyles = (isDark: boolean) => ({
  page: authPageSx(isDark),
  blobs: [
    blobSx(isDark, { at: { top: "-18%", right: "-10%" }, size: 600, rgb: AMBER, alpha: [0.17, 0.08] }),
    blobSx(isDark, { at: { bottom: "-15%", left: "-8%" }, size: 520, rgb: "99,102,241", alpha: [0.13, 0.06] }),
    blobSx(isDark, { at: { top: "50%", left: "25%" }, size: 300, rgb: "251,191,36", alpha: [0.08, 0.04], fade: 70 }),
  ],
  cardAccent: "rgba(245,158,11,0.10)",
  spinner: { color: "#f59e0b" },
  field: darkFieldSx(isDark, { accent: "#f59e0b", labelAccent: "#fcd34d", helperText: true }),
  // Expired link.
  expiredBadge: {
    ...iconBadgeSx(72, "50%", "linear-gradient(135deg, #ef4444, #b91c1c)", badgeGlow(RED, 12, 0.32)),
    mx: "auto",
    mb: 3,
  },
  expiredButton: {
    ...ctaButtonSx({ py: 1.45, fontSize: 14.5 }, {
      gradient: "linear-gradient(90deg, #ef4444, #dc2626)",
      hover: "linear-gradient(90deg, #f87171, #ef4444)",
      rgb: RED,
      shadow: [0.35, 0.48],
    }),
    mb: 1.5,
  },
  expiredBackLink: {
    display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5,
    transition: "color 0.15s",
    color: mutedColor(isDark, 0.28),
    "&:hover": { color: isDark ? authDark.white(0.6) : "text.primary" },
  },
  // Password changed.
  successBadge: {
    ...iconBadgeSx(72, "50%", "linear-gradient(135deg, #22c55e, #16a34a)", badgeGlow(GREEN, 12, 0.35)),
    mx: "auto",
    mb: 3,
  },
  successButton: ctaButtonSx({ py: 1.45, fontSize: 14.5 }, {
    gradient: "linear-gradient(90deg, #22c55e, #16a34a)",
    hover: "linear-gradient(90deg, #4ade80, #22c55e)",
    rgb: GREEN,
    shadow: [0.38, 0.5],
  }),
  // The form.
  badge: {
    ...iconBadgeSx(70, "18px", "linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)", badgeGlow(AMBER, 10, 0.35)),
    mb: 3,
  },
  submit: submitButtonSx({
    gradient: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
    hover: "linear-gradient(90deg, #fcd34d 0%, #f59e0b 100%)",
    rgb: AMBER,
    shadow: [0.38, 0.5],
  }),
}) satisfies PageStyles
