"use client";

import { Box, IconButton, Typography } from "@mui/material";
import { ICON_CHOICES } from "@/theme/categoryIcons";
import { useSettings } from "@/contexts/SettingsContext";
import { DEFAULT_ICON_COLOR, iconChoiceSx, iconGridSx } from "./IconPicker.styles";

type Props = { value?: string | null; onChange: (name: string) => void; color?: string; label?: string };

// Rejilla de iconos elegibles (ICON_CHOICES) para metas y categorías personalizadas.
// `value` es la clave que se guarda en DB (p. ej. "Flight"); un valor que no está en
// la lista (glifo viejo como "◉") simplemente no aparece seleccionado.
export function IconPicker({ value, onChange, color = DEFAULT_ICON_COLOR, label }: Props) {
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
        sx={iconGridSx}
      >
        {Object.entries(ICON_CHOICES).map(([name, Icon]) => {
          const selected = value === name;
          return (
            <IconButton
              key={name}
              role="radio"
              aria-checked={selected}
              aria-label={t.iconNames[name as keyof typeof t.iconNames] ?? name}
              onClick={() => onChange(name)}
              sx={iconChoiceSx(selected, color)}
            >
              <Icon fontSize="small" />
            </IconButton>
          );
        })}
      </Box>
    </Box>
  );
}
