import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Event as EventIcon } from "@/theme/icons";
import { recurringList } from "../domain/recurring";
import { GradientIcon, CategoryAvatar } from "@/components/ui/GradientIcon";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { accentCardSx } from "@/theme/tokens";
import { softRowSx } from "@/theme/tokens";

// Payments that repeat in 3+ months (recurringList), first 5 with "show more".
export function RecurringCard() {
  const { t, lang, fmt } = useSettings();
  const { txs, customCats } = useData();
  const [showAll, setShowAll] = useState(false);
  const recurring = useMemo(() => recurringList(txs), [txs]);

  return (
    <Card sx={accentCardSx("success.main")}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <GradientIcon icon={EventIcon} tone="income" bubble />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.recurring}</Typography>
            <Typography variant="body2" color="text.secondary">{recurring.length} {t.budgetTab.payments}</Typography>
          </Box>
        </Box>
        <Stack spacing={1}>
          {(showAll ? recurring : recurring.slice(0, 5)).map((r) => {
            const { label: catName, color, Icon } = resolveCategoryMeta(r.categoria, customCats, lang, "EGRESO");
            return (
              // The same concept can recur in two categories (e.g. MANTENIMIENTO for car and bike).
              <Box key={`${r.categoria}|${r.concepto}`} sx={softRowSx(2)}>
                <CategoryAvatar icon={Icon} color={color} size={36} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>{r.concepto}</Typography>
                  <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{catName} · {t.budgetTab.day(r.day)}</Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{fmt(r.avg, true)}</Typography>
              </Box>
            );
          })}
        </Stack>
        {recurring.length > 5 && (
          <Button size="small" onClick={() => setShowAll((v) => !v)} sx={{ mt: 1, alignSelf: "center" }}>
            {showAll ? (t.budgetTab.showLess) : (t.budgetTab.showMore(recurring.length - 5))}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
