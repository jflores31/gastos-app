import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { CompareArrows as CompareIcon } from "../../theme/icons";
import { periodLabel } from "../../data/helpers";
import { GradientIcon } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext";

// Spending of the previous period and the % change against this one.
export function PeriodComparisonCard({ period, prevOut, dOut }) {
  const { t, fmt } = useSettings();
  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "info.main", height: "100%", minHeight: 280, display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={CompareIcon} tone="goals" bubble />
          <Box>
            <Typography variant="h6" fontWeight={700}>{t.common.vsPreviousPeriod(period)}</Typography>
            <Typography variant="body2" color="text.secondary">{periodLabel(period, t)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flex: 1, gap: 2, alignItems: "center" }}>
          <Box sx={{ flex: 1, p: 2.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="caption" color="text.secondary">{t.budgetTab.previous}</Typography>
            <Typography variant="h5" fontWeight={700}>{fmt(prevOut, true)}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2.5, bgcolor: "action.hover", borderRadius: 2, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="caption" color="text.secondary">{t.budgetTab.change}</Typography>
            <Chip label={`${dOut > 0 ? "+" : ""}${dOut.toFixed(1)}%`} color={dOut > 0 ? "error" : "success"} size="medium" sx={{ fontWeight: 600, mt: 0.5 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
