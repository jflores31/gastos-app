import { Box, Button, Typography } from "@mui/material";
import { Add as AddIcon } from "@/theme/icons";
import { useSettings } from "../../context/SettingsContext";

export function EmptySection({ label, onAdd }) {
  const { t } = useSettings();
  return (
    <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
      <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
      <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
        {t.common.add}
      </Button>
    </Box>
  );
}
