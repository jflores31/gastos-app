"use client";

import { useId } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { gradientBg, resolveTone, tint } from "@/theme/iconTones";

// Pinta cualquier icono de theme/icons.ts con un gradiente alegre (relleno SVG) y,
// opcionalmente, lo monta en una burbuja squircle de tinte suave (light/dark aware).
// El gradiente usa un id único por instancia con useId() (mismo patrón que charts/Charts.tsx)
// para evitar colisiones de url(#id) cuando se montan varios iconos.
// Los tipos van en JSDoc para que los .tsx que lo usan sepan qué props son opcionales; el
// archivo sigue en JS (ver "Migración JS → TS" en docs/ARCHITECTURE-AUDIT.md).
/**
 * @param {{
 *   icon?: import("react").ElementType,
 *   children?: import("react").ReactNode,
 *   tone?: string | import("@/theme/iconTones").Tone | null,
 *   bubble?: boolean,
 *   size?: number,
 *   bubbleSize?: number,
 *   sx?: Record<string, unknown>,
 * }} props
 */
export function GradientIcon({
  icon: Icon,
  children,
  tone,
  bubble = false,
  size = 22,
  bubbleSize = 40,
  sx,
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const { from, to, base } = resolveTone(tone);
  const id = `gi-${useId().replace(/:/g, "")}`;

  const defs = (
    <Box component="svg" width={0} height={0} aria-hidden sx={{ position: "absolute" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
    </Box>
  );

  // Dos modos: `icon` (componente) o `children` (icono ya renderizado, coloreado por CSS).
  const glyph = children ? (
    <Box component="span" sx={{ display: "inline-flex", lineHeight: 0, "& .MuiSvgIcon-root": { fill: `url(#${id})`, fontSize: size } }}>
      {defs}
      {children}
    </Box>
  ) : (
    <Box component="span" sx={{ display: "inline-flex", lineHeight: 0 }}>
      {defs}
      <Icon sx={{ fontSize: size, fill: `url(#${id})`, ...sx }} />
    </Box>
  );

  if (!bubble) return glyph;

  return (
    <Box
      sx={{
        width: bubbleSize,
        height: bubbleSize,
        borderRadius: "30%",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${tint(from, dark ? 0.26 : 0.16)} 0%, ${tint(to, dark ? 0.26 : 0.16)} 100%)`,
        border: `1px solid ${tint(base, dark ? 0.32 : 0.22)}`,
      }}
    >
      {glyph}
    </Box>
  );
}

// Avatar de categoría: squircle con el gradiente del color de la categoría y su
// icono en blanco. Reemplaza las iniciales/números que mostraban las listas.
// `icon` y `color` vienen de resolveCategoryMeta() (theme/categoryIcons.ts).
/**
 * @param {{ icon: import("react").ElementType, color: string, size?: number, sx?: Record<string, unknown> }} props
 */
export function CategoryAvatar({ icon: Icon, color, size = 40, sx }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: "30%",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: gradientBg(color),
        color: "common.white",
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.55) }} />
    </Box>
  );
}
