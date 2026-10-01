// Styles of the auth screens (login, register, password recovery and reset). They have their own
// dark look, darker than the app's dark theme: its colours and the pieces the four pages share
// live here, with the styles of the small shared components (card, error, theme toggle). Each
// page keeps its own values (blobs, gradients, glows) in its *.styles.ts.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** What a page's styles module returns: sx objects, lists of them, and plain colours. */
export type PageStyles = Record<string, Sx | Sx[] | string>

/** Dark palette of the auth screens. */
export const authDark = {
  bg: "#07080f",
  title: "#f1f5f9",
  /** White at the given opacity: text, borders and fills of the dark look. */
  white: (alpha: number) => `rgba(255,255,255,${alpha})`,
}

export const titleColor = (isDark: boolean) => (isDark ? authDark.title : "text.primary")
export const mutedColor = (isDark: boolean, alpha: number) => (isDark ? authDark.white(alpha) : "text.secondary")

type Spacing = number | { xs: number; sm: number }

/** The full-height page that centres the card, over the auth background. */
export const authPageSx = (isDark: boolean, p: Spacing = { xs: 2, sm: 3 }): Sx => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "hidden",
  bgcolor: isDark ? authDark.bg : "background.default",
  p,
})

export interface Blob {
  at: { top?: string; bottom?: string; left?: string; right?: string }
  size: number
  /** "r,g,b" of the colour. */
  rgb: string
  /** Opacity in the dark and in the light theme. */
  alpha: [number, number]
  /** Where the gradient fades out, in %. */
  fade?: number
}

/** A soft radial gradient behind the card. */
export const blobSx = (isDark: boolean, { at, size, rgb, alpha: [dark, light], fade = 68 }: Blob): Sx => ({
  position: "absolute",
  ...at,
  width: size,
  height: size,
  borderRadius: "50%",
  pointerEvents: "none",
  background: `radial-gradient(circle, rgba(${rgb},${isDark ? dark : light}) 0%, transparent ${fade}%)`,
})

/** Halo of the icon badge: a faint ring and a coloured glow. */
export const badgeGlow = (rgb: string, ring: number, alpha: number) =>
  `0 0 0 ${ring}px rgba(${rgb},0.1), 0 14px 40px rgba(${rgb},${alpha})`

/** The icon badge at the top of the card (the page adds its margins). */
export const iconBadgeSx = (size: number, borderRadius: string, background: string, boxShadow: string): Sx => ({
  width: size,
  height: size,
  borderRadius,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background,
  boxShadow,
})

export interface Accent {
  gradient: string
  hover: string
  /** "r,g,b" of the glow. */
  rgb: string
  /** Glow opacity at rest and on hover. */
  shadow: [number, number]
}

/** The form's submit button: gradient, glow, and a dimmed disabled state. */
export const submitButtonSx = ({ gradient, hover, rgb, shadow: [rest, hovered] }: Accent): Sx => ({
  py: 1.55,
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: 15,
  textTransform: "none",
  letterSpacing: 0.2,
  background: gradient,
  color: "#fff",
  boxShadow: `0 4px 22px rgba(${rgb},${rest})`,
  "&:hover:not(:disabled)": {
    background: hover,
    boxShadow: `0 6px 30px rgba(${rgb},${hovered})`,
    transform: "translateY(-1px)",
  },
  "&:disabled": { background: `rgba(${rgb},0.3)`, color: authDark.white(0.38), boxShadow: "none" },
  transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
})

/** The call-to-action button of a result screen (a link, never disabled). */
export const ctaButtonSx = ({ py, fontSize }: { py: number; fontSize: number }, { gradient, hover, rgb, shadow: [rest, hovered] }: Accent): Sx => ({
  py,
  borderRadius: "10px",
  fontWeight: 700,
  fontSize,
  textTransform: "none",
  background: gradient,
  color: "#fff",
  boxShadow: `0 4px 22px rgba(${rgb},${rest})`,
  "&:hover": { background: hover, boxShadow: `0 6px 30px rgba(${rgb},${hovered})`, transform: "translateY(-1px)" },
  transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
})

/** Outlined button on the dark look (OAuth, back to login); nothing extra in light. */
export const darkOutlinedSx = (isDark: boolean): Sx =>
  isDark
    ? {
        color: authDark.white(0.72),
        border: `1px solid ${authDark.white(0.1)}`,
        bgcolor: authDark.white(0.05),
        "&:hover": { bgcolor: authDark.white(0.09), borderColor: authDark.white(0.2), color: "#fff" },
      }
    : {}

/** OAuth provider button (Google, GitHub). */
export const oauthButtonSx = (isDark: boolean): Sx => ({
  py: 1.25, borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: 13.5,
  ...darkOutlinedSx(isDark),
  transition: "background-color 0.18s, border-color 0.18s, color 0.18s",
})

/** "O CON EMAIL" between the OAuth buttons and the form. */
export const dividerLabelSx = (isDark: boolean): Sx => ({
  fontWeight: 700, letterSpacing: 1.8, fontSize: 10,
  color: isDark ? authDark.white(0.22) : "text.disabled",
})

/** The show/hide password icon. */
export const passwordToggleSx = (isDark: boolean): Sx =>
  isDark ? { color: authDark.white(0.32), "&:hover": { color: authDark.white(0.65) } } : {}

/** "Back to login" text link. */
export const backLinkSx = (isDark: boolean, { mb, alpha }: { mb: number; alpha: number }): Sx => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  mb,
  fontWeight: 500,
  transition: "color 0.15s",
  color: mutedColor(isDark, alpha),
  "&:hover": { color: isDark ? authDark.white(0.65) : "text.primary" },
})

/** Spinner inside a submit button. */
export const buttonSpinnerSx: Sx = { color: authDark.white(0.8) }

interface DarkFieldOpts {
  accent?: string
  labelAccent?: string
  helperText?: boolean
}

export function darkFieldSx(isDark: boolean, opts?: DarkFieldOpts) {
  if (!isDark) return {}
  const { accent = "#6366f1", labelAccent = "#a5b4fc", helperText = false } = opts ?? {}
  return {
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      bgcolor: "rgba(255,255,255,0.03)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
      "&.Mui-focused fieldset": { borderColor: accent, borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.38)" },
    "& .MuiInputLabel-root.Mui-focused": { color: labelAccent },
    ...(helperText ? { "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.3)" } } : {}),
  }
}

export const cardBaseSx = (isDark: boolean) => ({
  position: "relative" as const,
  zIndex: 1,
  width: "100%",
  bgcolor: isDark ? "transparent" : "background.paper",
  background: isDark ? "rgba(255,255,255,0.045)" : undefined,
  border: "1px solid",
  borderColor: isDark ? "rgba(255,255,255,0.09)" : "divider",
  backdropFilter: isDark ? "blur(36px)" : "none",
  borderRadius: "20px",
  boxShadow: isDark
    ? "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
    : undefined,
})

/** AuthCard's default accent: the tint of its light-theme shadow. */
export const defaultCardAccent = "rgba(99,102,241,0.10)"

/** AuthCard's shadow: deep in the dark look, tinted with the page accent in light. */
export const cardShadow = (isDark: boolean, accentColor: string) =>
  isDark
    ? "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)"
    : `0 8px 32px ${accentColor}, 0 2px 8px rgba(0,0,0,0.06)`

/** AuthErrorAlert's chip. */
export const errorChipSx = (isDark: boolean): Sx => ({
  width: "100%",
  justifyContent: "flex-start",
  px: 1.5,
  height: "auto",
  py: 0.75,
  bgcolor: "rgba(239,68,68,0.1)",
  color: isDark ? "#fca5a5" : "error.dark",
  border: "1px solid rgba(239,68,68,0.22)",
  borderRadius: "10px",
  "& .MuiChip-label": { whiteSpace: "normal" },
})

/** AuthThemeToggle: the floating sun/moon button. */
export const themeToggleSx = (isDark: boolean): Sx => ({
  position: "absolute",
  top: { xs: 14, sm: 22 },
  right: { xs: 14, sm: 22 },
  zIndex: 3,
  width: 44,
  height: 44,
  color: isDark ? authDark.white(0.72) : "text.secondary",
  bgcolor: isDark ? authDark.white(0.06) : "rgba(0,0,0,0.035)",
  border: "1px solid",
  borderColor: isDark ? authDark.white(0.1) : "divider",
  backdropFilter: "blur(8px)",
  "&:hover": {
    bgcolor: isDark ? authDark.white(0.12) : "rgba(0,0,0,0.06)",
    color: isDark ? "#fff" : "text.primary",
  },
  "& .MuiSvgIcon-root": { transition: "transform 0.3s cubic-bezier(.4,0,.2,1)" },
  "&:hover .MuiSvgIcon-root": { transform: "rotate(35deg)" },
  transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
})
