import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";
import { AccountBalanceWallet as WalletIcon, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, CheckCircle as HealthIcon, Warning as WarningIcon } from "@/theme/icons";
import { healthLabel, healthTone } from "@/domain/health";
import { TONE_BY_PALETTE } from "@/theme/iconTones";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { accentCardSx } from "@/theme/tokens";
import { gaugeArcSx, gaugePanelSx, gaugeScoreSx, gaugeSvgSx, healthStatSx } from "./budgets.styles";

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
    <Card sx={accentCardSx(gaugeColor + ".main", "section")}>
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={gaugePanelSx}>
              <Box sx={{ mb: 1 }}>
                <GradientIcon icon={GaugeIcon} tone={TONE_BY_PALETTE[gaugeColor]} bubble bubbleSize={64} size={34} />
              </Box>
              <Box sx={{ position: "relative", width: 120, height: 72 }}>
                <Box component="svg" viewBox="0 0 120 72" sx={gaugeSvgSx}>
                  <path d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" opacity={0.15} strokeWidth="10" strokeLinecap="round" />
                  <Box component="path" d="M10,66 A55,55,0,0,1,110,66" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 172.8} 200`} sx={gaugeArcSx(gaugeColor)} />
                </Box>
                <Typography variant="h4" sx={gaugeScoreSx(gaugeColor)}>{score}</Typography>
              </Box>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>{t.healthScore}</Typography>
              <Chip label={healthLabel(score, lang)} color={gaugeColor} size="small" sx={{ fontWeight: 600, mt: 1 }} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {stats.map(({ lbl, val, c, icon }) => (
                <Grid size={{ xs: 6, md: 3 }} key={lbl}>
                  <Box sx={healthStatSx}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      {icon}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{lbl}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: c }}>{val}</Typography>
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
