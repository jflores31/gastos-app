import { useMemo } from "react";
import { Box, Card, CardContent, Tooltip, Typography } from "@mui/material";
import { PieChart as PieIcon } from "@/theme/icons";
import { GradientIcon, CategoryAvatar } from "@/components/ui/GradientIcon";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { Donut } from "@/components/charts/Charts";
import { distributionBodySx, distributionCenterSx, distributionDonutSx, distributionLabelSx, distributionRowSx, tallAccentCardSx } from "./budgets.styles";

// Donut of what was spent in each budgeted category this period.
export function DistributionCard({ cats }) {
  const { t, lang, fmt } = useSettings();
  const { editBudgets, customCats } = useData();

  const donutData = useMemo(() => {
    return Object.keys(editBudgets).map((cat) => {
      const spent = cats.find((c) => c.categoria === cat)?.total || 0;
      const { label, color, Icon } = resolveCategoryMeta(cat, customCats, lang, "EGRESO");
      return { label, value: spent, color, Icon };
    }).filter(d => d.value > 0);
  }, [editBudgets, cats, lang, customCats]);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <Card sx={tallAccentCardSx("warning.main")}>
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={PieIcon} tone="warning" bubble />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.budgetTab.distribution}</Typography>
        </Box>
        <Box sx={distributionBodySx}>
          <Box sx={distributionDonutSx}>
            <Donut slices={donutData} size={160} thickness={16} />
            <Box sx={distributionCenterSx}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{fmt(donutTotal, true)}</Typography>
              <Typography variant="caption" color="text.secondary">{t.spent}</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, maxHeight: 200, overflowY: "auto" }}>
            {donutData.slice(0, 5).map((s) => (
              <Tooltip key={s.label} title={s.label} arrow placement="top">
                <Box sx={distributionRowSx}>
                  <CategoryAvatar icon={s.Icon} color={s.color} size={22} />
                  <Typography variant="body2" sx={distributionLabelSx}>{s.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{donutTotal > 0 ? Math.round((s.value / donutTotal) * 100) : 0}%</Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
