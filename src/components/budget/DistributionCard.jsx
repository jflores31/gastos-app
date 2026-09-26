import { useMemo } from "react";
import { Box, Card, CardContent, Tooltip, Typography } from "@mui/material";
import { PieChart as PieIcon } from "../../theme/icons";
import { fmtMoney } from "../../data/index.js";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { Donut } from "../Charts.jsx";

// Donut of what was spent in each budgeted category this period.
export function DistributionCard({ cats }) {
  const { t, lang, currency } = useSettings();
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
    <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "warning.main", height: "100%", minHeight: 280, display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={PieIcon} tone="warning" bubble />
          <Typography variant="h6" fontWeight={700}>{t.budgetTab.distribution}</Typography>
        </Box>
        <Box sx={{ display: "flex", flex: 1, gap: 3, alignItems: "center", flexDirection: { xs: "column", sm: "row" } }}>
          <Box sx={{ position: "relative", width: 180, height: 180, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Donut slices={donutData} size={160} thickness={16} />
            <Box sx={{ position: "absolute", textAlign: "center", bgcolor: "background.paper", borderRadius: "50%", width: 80, height: 80, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Typography variant="body1" fontWeight={700}>{fmtMoney(donutTotal, currency, true)}</Typography>
              <Typography variant="caption" color="text.secondary">{t.spent}</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, maxHeight: 200, overflowY: "auto" }}>
            {donutData.slice(0, 5).map((s) => (
              <Tooltip key={s.label} title={s.label} arrow placement="top">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, p: 1, borderRadius: 1.5, bgcolor: "action.hover", cursor: "default" }}>
                  <CategoryAvatar icon={s.Icon} color={s.color} size={22} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{donutTotal > 0 ? Math.round((s.value / donutTotal) * 100) : 0}%</Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
