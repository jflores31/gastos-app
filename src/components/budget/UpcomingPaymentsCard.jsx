import { useMemo } from "react";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { CalendarMonth as UpcomingIcon } from "@/theme/icons";
import { upcomingPayments } from "../../data/helpers";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";

const DAY = 24 * 60 * 60 * 1000;

// What's due from today until the same day next month (upcomingPayments): detected
// recurring expenses and subscriptions. "Registrar" opens the transaction form filled in.
export function UpcomingPaymentsCard({ openModal }) {
  const { t, lang, fmt } = useSettings();
  const { txs, subscriptions, customCats } = useData();
  const today = useMemo(() => new Date(), []);
  const upcoming = useMemo(() => upcomingPayments(txs, subscriptions, today), [txs, subscriptions, today]);
  const total = upcoming.reduce((s, p) => s + p.amount, 0);
  const until = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(today.getDate(), new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate()));
  const dateLabel = (due) => {
    const days = Math.round((new Date(due.getFullYear(), due.getMonth(), due.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / DAY);
    if (days === 0) return t.budgetTab.today;
    if (days === 1) return t.budgetTab.tomorrow;
    return due.toLocaleDateString(t.common.locale, { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderTop: "3px solid", borderTopColor: "warning.main" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={UpcomingIcon} tone="warning" bubble />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700}>{t.budgetTab.upcomingPayments}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t.budgetTab.upcomingUntil(until.toLocaleDateString(t.common.locale, { day: "numeric", month: "long" }))}
            </Typography>
          </Box>
          {upcoming.length > 0 && <Typography variant="subtitle1" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{t.budgetTab.upcomingTotal(fmt(total, true))}</Typography>}
        </Box>

        {upcoming.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t.budgetTab.upcomingEmpty}</Typography>
        ) : (
          <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {upcoming.map((p) => {
              const { label: catName, color, Icon } = resolveCategoryMeta(p.categoria, customCats, lang, "EGRESO");
              return (
                <Box component="li" key={`${p.source}|${p.categoria}|${p.concepto}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                  <CategoryAvatar icon={Icon} color={color} size={36} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={600} noWrap>{p.concepto}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                      {p.overdue && <Chip size="small" color="error" variant="outlined" label={t.budgetTab.overdue} sx={{ height: 18, fontSize: 11, flexShrink: 0 }} />}
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {p.due ? dateLabel(p.due) : t.budgetTab.noDate} · <Box component="span" sx={{ color, fontWeight: 500 }}>{catName}</Box>
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{fmt(p.amount)}</Typography>
                  <Button size="small" variant="outlined" aria-label={t.budgetTab.registerPayment(p.concepto)}
                    onClick={() => openModal?.(p.categoria, "expense", { concepto: p.concepto.toUpperCase(), valor: p.amount })}
                    sx={{ borderRadius: 2, textTransform: "none", minWidth: 0 }}>
                    {t.budgetTab.register}
                  </Button>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
