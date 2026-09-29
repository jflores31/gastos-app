import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import { AccountBalanceWallet as WalletIcon, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, CheckCircle as HealthIcon, Warning as WarningIcon } from "@/theme/icons";
import { healthLabel, healthTone } from "@/domain/health";
import { TONE_BY_PALETTE } from "@/theme/iconTones";
import { GradientIcon } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext";

// Financial health gauge + budget, spent, usage and income for the period.
export function HealthSummaryCard({ score, totalBudget, totalOut, totalIn, budgetUsed }) {
  const { t, lang, fmt } = useSettings();
  const gaugeColor = healthTone(score);
  const GaugeIcon = score >= 75 ? HealthIcon : WarningIcon;
  const stats = [
    { lbl: t.budgetTab.budget, val: fmt(totalBudget, true), c: "primary.main", icon: <WalletIcon fontSize="small" /> },
    { lbl: t.spent, val: fmt(totalOut, true), c: budgetUsed > 1 ? "error.main" : "success.main", icon: <TrendDownIcon fontSize="small" /> },
    { lbl: t.budgetTab.usage, val: Math.round(budgetUsed * 100) + "%", c: budgetUsed > 1 ? "error.main" : "primary.main", icon: null },
    { lbl: t.income, val: fmt(totalIn, true), c: "success.main", icon: <TrendUpIcon fontSize="small" /> },
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: gaugeColor + ".main" }}>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
              <Box sx={{ mb: 1 }}>
                <GradientIcon icon={GaugeIcon} tone={TONE_BY_PALETTE[gaugeColor]} bubble bubbleSize={64} size={34} />
              </Box>
              <Box sx={{ position: "relative", width: 120, height: 72 }}>
                <svg viewBox="0 0 120 72" style={{ width: "100%", height: "100%" }}>
                  <path d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" opacity={0.15} strokeWidth="10" strokeLinecap="round" />
                  <path d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 172.8} 200`} style={{ color: gaugeColor === "success" ? "var(--income)" : gaugeColor === "warning" ? "#F9A825" : "var(--expense)" }} />
                </svg>
                <Typography variant="h4" fontWeight={800} sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, 20%)", color: gaugeColor + ".main" }}>{score}</Typography>
              </Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>{t.healthScore}</Typography>
              <Chip label={healthLabel(score, lang)} color={gaugeColor} size="small" sx={{ fontWeight: 600, mt: 1 }} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {stats.map(({ lbl, val, c, icon }) => (
                <Grid size={{ xs: 6, md: 3 }} key={lbl}>
                  <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      {icon}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{lbl}</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: c }}>{val}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
