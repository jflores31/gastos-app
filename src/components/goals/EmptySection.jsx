import { Box, Button, Typography } from "@mui/material";
import { Add as AddIcon } from "../../theme/icons";

export function EmptySection({ label, onAdd, lang = "es" }) {
  return (
    <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
      <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
      <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
        {lang === "es" ? "Agregar" : "Add"}
      </Button>
    </Box>
  );
}
