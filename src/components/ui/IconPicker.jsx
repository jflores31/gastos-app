"use client";

import { Box, IconButton, Typography } from "@mui/material";
import { ICON_CHOICES } from "@/theme/categoryIcons";
import { tint } from "@/theme/iconTones";
import { useSettings } from "@/contexts/SettingsContext";

// Rejilla de iconos elegibles (ICON_CHOICES) para metas y categorías personalizadas.
// `value` es la clave que se guarda en DB (p. ej. "Flight"); un valor que no está en
// la lista (glifo viejo como "◉") simplemente no aparece seleccionado.
export function IconPicker({ value, onChange, color = "#7C8CA1", label }) {
  const { t } = useSettings();
  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          {label}
        </Typography>
      )}
      <Box
        role="radiogroup"
        aria-label={label}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
          gap: 0.75,
          maxHeight: 180,
          overflowY: "auto",
          p: 0.5,
        }}
      >
        {Object.entries(ICON_CHOICES).map(([name, Icon]) => {
          const selected = value === name;
          return (
            <IconButton
              key={name}
              role="radio"
              aria-checked={selected}
              aria-label={t.iconNames[name] ?? name}
              onClick={() => onChange(name)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "30%",
                border: "1.5px solid",
                borderColor: selected ? color : "divider",
                bgcolor: selected ? tint(color, 0.16) : "transparent",
                color: selected ? color : "text.secondary",
              }}
            >
              <Icon fontSize="small" />
            </IconButton>
          );
        })}
      </Box>
    </Box>
  );
}
