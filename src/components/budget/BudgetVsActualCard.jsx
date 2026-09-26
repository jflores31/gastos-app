import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { CompareArrows as CompareIcon } from "../../theme/icons";
import { fmtMoney } from "../../data/index.js";
import { monthCount, periodLabel } from "../../data/helpers.js";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";

// One bar per budgeted category, plus totals restricted to budgeted categories.
export function BudgetVsActualCard({ cats, period, totalBudget }) {
  const { t, lang, currency } = useSettings();
  const { editBudgets, customCats } = useData();
  const spentIn = (cat) => cats.find((c) => c.categoria === cat)?.total || 0;
  // Denominator matches the rows below: spending in budgeted categories only.
  const totalSpentBudgeted = Object.keys(editBudgets).reduce((s, cat) => s + spentIn(cat), 0);
  const used = totalBudget > 0 ? totalSpentBudgeted / totalBudget : 0;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "primary.main" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <GradientIcon icon={CompareIcon} tone="trend" bubble />
          <Box>
            <Typography variant="h6" fontWeight={700}>{t.budgetTab.budgetVsActual}</Typography>
            <Typography variant="body2" color="text.secondary">{periodLabel(period, t)}</Typography>
          </Box>
        </Box>
        <Stack spacing={2}>
          {Object.keys(editBudgets).map((cat) => {
            const spent = spentIn(cat);
            const limit = editBudgets[cat] * monthCount(period);
            const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
            const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
            const { label: catName, color, Icon } = resolveCategoryMeta(cat, customCats, lang, "EGRESO");
            const isOver = rawPct > 100;
            const isWarn = rawPct >= 80 && rawPct <= 100;
            const barColor = isOver ? "error.main" : isWarn ? "warning.main" : "success.main";
            return (
              <Box key={cat}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.75 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CategoryAvatar icon={Icon} color={color} size={24} />
                    <Box>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 140, sm: 220 } }}>{catName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.budgetTab.spent}{" "}
                        <Box component="strong" sx={{ color: isOver ? "error.main" : "text.primary" }}>{fmtMoney(spent, currency, true)}</Box>
                        {" · "}{t.budgetTab.limit} {fmtMoney(limit, currency, true)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label={`${rawPct.toFixed(0)}%`}
                    color={isOver ? "error" : isWarn ? "warning" : "success"}
                    variant="filled"
                    sx={{ fontWeight: 700, height: 20, fontSize: 11, minWidth: 46, flexShrink: 0 }}
                  />
                </Box>
                <Box sx={{ position: "relative", height: 10, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }}>
                  <Box
                    sx={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      width: `${pct * 100}%`,
                      bgcolor: barColor,
                      borderRadius: 6,
                      transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                      backgroundImage: isOver
                        ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)"
                        : "none",
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: barColor, fontWeight: 600, mt: 0.5, display: "block" }}>
                  {isOver
                    ? `${t.budgetTab.overBy} ${fmtMoney(spent - limit, currency, true)}`
                    : `${t.budgetTab.available} ${fmtMoney(limit - spent, currency, true)}`}
                </Typography>
              </Box>
            );
          })}
        </Stack>
        {/* Summary footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t.budgetTab.totalSpent}: <strong>{fmtMoney(totalSpentBudgeted, currency, true)}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t.budgetTab.totalBudget}: <strong>{fmtMoney(totalBudget, currency, true)}</strong>
          </Typography>
          <Chip
            size="small"
            label={`${Math.round(used * 100)}% ${t.budgetTab.used}`}
            color={used > 1 ? "error" : used >= 0.8 ? "warning" : "success"}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
