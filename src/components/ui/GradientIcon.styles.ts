// Styles of GradientIcon and CategoryAvatar.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"
import { gradientBg, tint } from "@/theme/iconTones"

type Sx = SystemStyleObject<Theme>

/** Wrapper of an already rendered icon: paints it with the gradient `id`. */
export const glyphSx = (id: string, size: number): Sx => ({
  display: "inline-flex", lineHeight: 0, "& .MuiSvgIcon-root": { fill: `url(#${id})`, fontSize: size },
})

/** Squircle bubble on a soft tint of the tone; a stronger tint in dark mode. */
export const bubbleSx = (size: number, { from, to, base }: { from: string; to: string; base: string }, dark: boolean): Sx => ({
  width: size,
  height: size,
  borderRadius: "30%",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, ${tint(from, dark ? 0.26 : 0.16)} 0%, ${tint(to, dark ? 0.26 : 0.16)} 100%)`,
  border: `1px solid ${tint(base, dark ? 0.32 : 0.22)}`,
})

/** Squircle on the category's colour gradient, with a white icon. */
export const categoryAvatarSx = (size: number, color: string): Sx => ({
  width: size,
  height: size,
  borderRadius: "30%",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: gradientBg(color),
  color: "common.white",
})
