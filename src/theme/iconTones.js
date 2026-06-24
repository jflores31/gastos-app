// Tonos de iconos: gradientes alegres de 2 stops, alusivos a finanzas.
// Fuente única para <GradientIcon>. Los tonos semánticos cubren los dominios
// (ingresos, gastos, presupuesto, metas, patrimonio, insights); para las
// categorías se deriva un gradiente vibrante desde su color base con toneFromColor().

/* ---------- utilidades de color ---------- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s); l = clamp(l);
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Tint rgba a partir de un hex (para fondos de burbuja).
export function tint(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Fondo gradiente (135deg) listo para `background` desde un color base de categoría.
export function gradientBg(hex, angle = 135) {
  const { from, to } = toneFromColor(hex);
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}

// Deriva un gradiente vibrante de 2 stops desde un color base de categoría:
// stop1 algo más profundo/saturado, stop2 más brillante y con leve rotación de tono.
export function toneFromColor(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  const from = hslToHex(h - 6, clamp(s * 1.08, 0.35, 1), clamp(l * 0.9, 0.32, 0.6));
  const to = hslToHex(h + 14, clamp(s * 1.12, 0.4, 1), clamp(l * 1.16, 0.45, 0.74));
  return { from, to, base: hex };
}

/* ---------- tonos semánticos por dominio ---------- */
export const TONES = {
  income:   { from: "#34D399", to: "#0EA5A5", base: "#10B981" }, // verde → teal
  expense:  { from: "#FB7185", to: "#F43F5E", base: "#F43F5E" }, // coral → rosa
  budget:   { from: "#FBBF24", to: "#F59E0B", base: "#F59E0B" }, // ámbar → dorado
  goals:    { from: "#38BDF8", to: "#14B8A6", base: "#22B8C8" }, // azul → teal
  networth: { from: "#818CF8", to: "#7C3AED", base: "#7C5CF6" }, // índigo → violeta
  savings:  { from: "#34D399", to: "#059669", base: "#10B981" }, // esmeralda
  trend:    { from: "#38BDF8", to: "#6366F1", base: "#4F8FF7" }, // sky → índigo
  warning:  { from: "#FBBF24", to: "#F97316", base: "#FB8C00" }, // ámbar → naranja
  forecast: { from: "#A78BFA", to: "#6366F1", base: "#8B7CF6" }, // violeta → índigo
  neutral:  { from: "#94A3B8", to: "#64748B", base: "#7C8CA1" }, // gris azulado pulido
};

// Resuelve un tono: nombre semántico (TONES), color hex (toneFromColor) u objeto {from,to}.
export function resolveTone(tone) {
  if (!tone) return TONES.neutral;
  if (typeof tone === "string") {
    return tone.startsWith("#") ? toneFromColor(tone) : (TONES[tone] || TONES.neutral);
  }
  return tone;
}
