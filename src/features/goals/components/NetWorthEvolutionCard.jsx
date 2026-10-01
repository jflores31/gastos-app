import { Box, Card, CardContent, Typography } from "@mui/material";
import { History as HistoryIcon } from "@/theme/icons";
import { GradientIcon } from "@/components/ui/GradientIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { accentCardSx } from "@/theme/tokens";
import { summaryBarSx } from "@/theme/tokens";
import { monthBarSx, monthColumnSx, monthTrackSx } from "./goals.styles";

// Net worth over the last 6 months, rebuilt backwards from today's value: each month is
// today's net worth minus the net of the months after it.
export function NetWorthEvolutionCard({ months, netWorth }) {
  const { t, fmt } = useSettings();
  const recent = months.slice(-6);
  const nets = recent.map((m) => m.ingreso - m.egreso);
  const history = recent.map((m, i) => ({ month: t.months[m.mes], value: netWorth - nets.slice(i + 1).reduce((s, n) => s + n, 0) }));
  const maxVal = Math.max(...history.map((h) => Math.abs(h.value)), 1);
  const initial = months.length > 0 ? netWorth - nets.slice(1).reduce((s, n) => s + n, 0) : netWorth;

  return (
    <Card sx={{ width: "100%", minHeight: { xs: 280, sm: 320, md: 350 }, ...accentCardSx("success.main", "section") }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={HistoryIcon} tone="income" bubble />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t.goalsTab.netWorthEvolution}</Typography>
            <Typography variant="caption" color="text.secondary">{t.goalsTab.last6Months}</Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          {recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4, fontStyle: "italic" }}>{t.goalsTab.noTransactionData}</Typography>
          ) : (
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 150 }} role="img" aria-label={t.goalsTab.netWorthEvolutionChart}>
              {history.map((h, i) => (
                <Box key={i} sx={monthColumnSx}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{fmt(h.value, true)}</Typography>
                  <Box sx={monthTrackSx}>
                    <Box sx={monthBarSx({ value: h.value, max: maxVal, isLast: i === history.length - 1 })} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">{h.month}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={summaryBarSx("success")}>
          <Box>
            <Typography variant="caption" color="success.dark">{t.goalsTab.initialNetWorth}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }} color="success.dark">{fmt(initial)}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="success.dark">{t.goalsTab.currentNetWorth}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }} color="success.dark">{fmt(netWorth)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
