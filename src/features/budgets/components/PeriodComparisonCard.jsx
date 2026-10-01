import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { CompareArrows as CompareIcon } from "@/theme/icons";
import { periodLabel } from "@/domain/period";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { comparisonPanelSx, tallAccentCardSx } from "./budgets.styles";

// Spending of the previous period and the % change against this one.
export function PeriodComparisonCard({ period, prevOut, dOut }) {
  const { t, fmt } = useSettings();
  return (
    <Card sx={tallAccentCardSx("info.main")}>
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={CompareIcon} tone="goals" bubble />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.common.vsPreviousPeriod(period)}</Typography>
            <Typography variant="body2" color="text.secondary">{periodLabel(period, t)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flex: 1, gap: 2, alignItems: "center" }}>
          <Box sx={comparisonPanelSx}>
            <Typography variant="caption" color="text.secondary">{t.budgetTab.previous}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{fmt(prevOut, true)}</Typography>
          </Box>
          <Box sx={comparisonPanelSx}>
            <Typography variant="caption" color="text.secondary">{t.budgetTab.change}</Typography>
            <Chip label={`${dOut > 0 ? "+" : ""}${dOut.toFixed(1)}%`} color={dOut > 0 ? "error" : "success"} size="medium" sx={{ fontWeight: 600, mt: 0.5 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
