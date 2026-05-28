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
