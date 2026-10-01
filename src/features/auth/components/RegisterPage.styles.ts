// Styles of the sign-up page: green accent.
import {
  type PageStyles, authPageSx, badgeGlow, blobSx, ctaButtonSx, darkFieldSx, iconBadgeSx, submitButtonSx,
} from "./auth.styles"

const GREEN = "34,197,94"

export const registerStyles = (isDark: boolean) => ({
  page: { ...authPageSx(isDark), py: { xs: 4, sm: 5 } },
  successPage: authPageSx(isDark, 3),
  blobs: [
    blobSx(isDark, { at: { top: "-18%", right: "-10%" }, size: 620, rgb: GREEN, alpha: [0.18, 0.08] }),
    blobSx(isDark, { at: { bottom: "-15%", left: "-8%" }, size: 520, rgb: "99,102,241", alpha: [0.14, 0.07] }),
    blobSx(isDark, { at: { top: "45%", left: "30%" }, size: 300, rgb: "20,184,166", alpha: [0.1, 0.05], fade: 70 }),
  ],
  cardAccent: "rgba(34,197,94,0.10)",
  badge: {
    ...iconBadgeSx(70, "18px", "linear-gradient(135deg, #22c55e 0%, #6366f1 100%)", badgeGlow(GREEN, 10, 0.38)),
    mx: "auto",
    mb: 2.5,
  },
  successBadge: {
    ...iconBadgeSx(80, "50%", "linear-gradient(135deg, #22c55e, #16a34a)", badgeGlow(GREEN, 12, 0.35)),
    mx: "auto",
    mb: 3,
  },
  successButton: ctaButtonSx({ py: 1.5, fontSize: 15 }, {
    gradient: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
    hover: "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)",
    rgb: GREEN,
    shadow: [0.4, 0.5],
  }),
  field: darkFieldSx(isDark, { accent: "#22c55e", labelAccent: "#86efac", helperText: true }),
  submit: {
    ...submitButtonSx({
      gradient: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
      hover: "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)",
      rgb: GREEN,
      shadow: [0.38, 0.5],
    }),
    mb: 3.5,
  },
  loginLink: {
    fontWeight: 700, fontSize: 13,
    color: isDark ? "#86efac" : "success.main",
    "&:hover": { color: isDark ? "#4ade80" : "success.dark" },
    transition: "color 0.15s",
  },
}) satisfies PageStyles
