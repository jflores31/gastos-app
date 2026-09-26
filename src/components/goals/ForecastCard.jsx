import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Timeline as ForecastIcon } from "../../theme/icons";
import { linearRegressionSlope } from "../../data/helpers.js";
import { GradientIcon } from "../../theme/GradientIcon.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";

// Next 3 months' net, from the average of the last 6 months plus their linear trend.
// `months` is txByMonth(txs).slice(-12).
export function ForecastCard({ months }) {
  const { t } = useSettings();
  return (
    <Card sx={{ width: "100%", minHeight: 350, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "info.main" }}>
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <GradientIcon icon={ForecastIcon} tone="forecast" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{t.forecast} · {t.goalsTab.threeMonths}</Typography>
              <Typography variant="caption" color="text.secondary">{t.goalsTab.basedOnTrend}</Typography>
            </Box>
          </Box>
          <Chip size="small" label="ML" color="info" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <ForecastBody months={months} />
        </Box>
      </CardContent>
    </Card>
  );
}

function ForecastBody({ months }) {
  const { t, fmt } = useSettings();
  const recent = months.slice(-6);
  if (recent.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4, fontStyle: "italic" }}>{t.goalsTab.noTransactionData}</Typography>;
  }
  if (recent.length < 2) {
    const singleNet = recent[0].ingreso - recent[0].egreso;
    return (
      <Box sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
          {t.goalsTab.needTwoMonths}
        </Typography>
        <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 2, borderLeft: 4, borderColor: "info.main" }}>
          <Typography variant="body2" fontWeight={600} color="info.dark">
            {t.goalsTab.currentAverage} {singleNet >= 0 ? "+" : "−"}{fmt(Math.abs(singleNet), true)}{t.common.perMonth}
          </Typography>
        </Box>
      </Box>
    );
  }
  const avgIn = recent.reduce((s, m) => s + m.ingreso, 0) / recent.length;
  const avgOut = recent.reduce((s, m) => s + m.egreso, 0) / recent.length;
  const netAvg = avgIn - avgOut;
  const nets = recent.map((m) => m.ingreso - m.egreso);
  const trend = linearRegressionSlope(nets);
  const next = [1, 2, 3].map((i) => ({ i, label: t.months[(new Date().getMonth() + i) % 12], net: netAvg + trend * i }));
  const barPct = (n) => avgIn > 0 ? Math.min(100, Math.abs(n.net / avgIn) * 100) : 50;
  const isTrendFlat = Math.abs(trend) < 1;
  return (
    <Stack spacing={2}>
      {next.map((n) => (
        <Box key={n.i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ width: 50, fontFamily: "monospace", fontWeight: 600 }}>{n.label}</Typography>
          <Box sx={{ flex: 1, height: 12, borderRadius: 6, bgcolor: "action.hover", overflow: "hidden" }} role="progressbar" aria-valuenow={Math.round(barPct(n))} aria-valuemin={0} aria-valuemax={100}>
            <Box sx={{ height: "100%", width: `${barPct(n)}%`, borderRadius: 6, bgcolor: n.net >= 0 ? "success.main" : "error.main" }} />
          </Box>
          <Typography variant="body2" fontWeight={700} color={n.net >= 0 ? "success.main" : "error.main"} sx={{ minWidth: 85, textAlign: "right" }}>
            {n.net >= 0 ? "+" : "−"}{fmt(Math.abs(n.net), true)}
          </Typography>
        </Box>
      ))}
      <Box sx={{ mt: 1, p: 2, bgcolor: "info.light", borderRadius: 2, borderLeft: 4, borderColor: "info.main" }}>
        <Typography variant="body2" fontWeight={600} color="info.dark">
          {t.goalsTab.n3MonthProjection} {fmt(next.reduce((s, n) => s + n.net, 0), true)}
        </Typography>
        {isTrendFlat && (
          <Typography variant="caption" color="info.dark" sx={{ opacity: 0.75, display: "block", mt: 0.5 }}>
            {t.goalsTab.stableTrend(recent.length)}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
