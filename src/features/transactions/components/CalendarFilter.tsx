import { useState, useMemo } from "react";
import { Box, Typography, Chip, IconButton, Collapse, Paper } from "@mui/material";
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, CalendarMonth as CalendarIcon } from "@/theme/icons";
import { useTheme, alpha } from "@mui/material/styles";
import { useSettings } from "@/contexts/SettingsContext";
import type { Transaction, TxType } from "@/types/domain";
import type { CalendarSelection } from "../domain/calendarFilter";
import {
  dayCellSx, heatLegendSx, modeChipSx, monthAmountSx, monthCellSx, monthNameSx, panelSx, selectedChipSx, triggerChipSx,
} from "./CalendarFilter.styles";

type Props = {
  txs: Pick<Transaction, "tipo" | "date" | "valor">[];
  tipo: TxType;
  onFilter: (selection: CalendarSelection | null) => void;
};

export function CalendarFilter({ txs, tipo, onFilter }: Props) {
  const { t, fmt } = useSettings();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarSelection["type"]>("day");
  const [navDate, setNavDate] = useState(new Date());
  const [selected, setSelected] = useState<CalendarSelection | null>(null);

  const mainColor = tipo === "EGRESO" ? theme.palette.error.main : theme.palette.success.main;
  const sign = tipo === "EGRESO" ? "−" : "+";
  const monthNames = t.months;
  const dayNames = t.days;

  const dayMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const tx of txs) {
      if (tx.tipo !== tipo) continue;
      const d = tx.date;
      if (d.getFullYear() === navDate.getFullYear() && d.getMonth() === navDate.getMonth()) {
        const k = d.getDate();
        m.set(k, (m.get(k) || 0) + tx.valor);
      }
    }
    return m;
  }, [txs, tipo, navDate]);

  const monthMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const tx of txs) {
      if (tx.tipo !== tipo) continue;
      const d = tx.date;
      if (d.getFullYear() === navDate.getFullYear()) {
        const k = d.getMonth();
        m.set(k, (m.get(k) || 0) + tx.valor);
      }
    }
    return m;
  }, [txs, tipo, navDate]);

  const maxDay = Math.max(1, ...dayMap.values());
  const maxMonth = Math.max(1, ...monthMap.values());
  const daysInMonth = new Date(navDate.getFullYear(), navDate.getMonth() + 1, 0).getDate();
  const startOffset = (new Date(navDate.getFullYear(), navDate.getMonth(), 1).getDay() + 6) % 7;
  const today = new Date();

  const clearFilter = () => { setSelected(null); onFilter(null); setOpen(false); };

  const prevNav = () => viewMode === "day"
    ? setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1))
    : setNavDate(new Date(navDate.getFullYear() - 1, 0, 1));

  const nextNav = () => viewMode === "day"
    ? setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1))
    : setNavDate(new Date(navDate.getFullYear() + 1, 0, 1));

  const handleDayClick = (day: number) => {
    const date = new Date(navDate.getFullYear(), navDate.getMonth(), day);
    const isSame = selected?.type === "day" && selected.date.toDateString() === date.toDateString();
    if (isSame) { clearFilter(); return; }
    const f: CalendarSelection = { type: "day", date };
    setSelected(f); onFilter(f); setOpen(false);
  };

  const handleMonthClick = (month: number) => {
    const date = new Date(navDate.getFullYear(), month, 1);
    const isSame = selected?.type === "month" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === month;
    if (isSame) { clearFilter(); return; }
    const f: CalendarSelection = { type: "month", date };
    setSelected(f); onFilter(f); setOpen(false);
  };

  const isSelDay = (day: number) => selected?.type === "day" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === navDate.getMonth() && selected.date.getDate() === day;
  const isSelMonth = (m: number) => selected?.type === "month" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === m;
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === navDate.getMonth() && today.getFullYear() === navDate.getFullYear();
  const isCurMonth = (m: number) => today.getMonth() === m && today.getFullYear() === navDate.getFullYear();

  const selectedLabel = selected
    ? selected.type === "day"
      ? selected.date.toLocaleDateString(t.common.locale, { day: "numeric", month: "short" })
      : `${monthNames[selected.date.getMonth()]} ${selected.date.getFullYear()}`
    : null;

  return (
    <Box>
      {/* Trigger chip */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {selected ? (
          <Chip
            size="small"
            icon={<CalendarIcon sx={{ fontSize: "14px !important" }} />}
            label={selectedLabel}
            onDelete={clearFilter}
            onClick={() => setOpen((o) => !o)}
            sx={selectedChipSx(mainColor)}
          />
        ) : (
          <Chip
            size="small"
            icon={<CalendarIcon sx={{ fontSize: "14px !important" }} />}
            label={t.sharedUi.filterByDate}
            onClick={() => setOpen((o) => !o)}
            variant="outlined"
            sx={triggerChipSx(mainColor)}
          />
        )}
      </Box>

      {/* Collapsible calendar panel */}
      <Collapse in={open} unmountOnExit>
        <Paper elevation={0} sx={panelSx}>
          {/* View mode tabs */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, alignItems: "center" }}>
            {["day", "month"].map((mode) => (
              <Chip
                key={mode}
                size="small"
                label={mode === "day" ? (t.sharedUi.day) : (t.sharedUi.month)}
                aria-label={mode === "day" ? (t.sharedUi.viewByDay) : (t.sharedUi.viewByMonth)}
                onClick={() => { setViewMode(mode as CalendarSelection["type"]); clearFilter(); setOpen(true); }}
                variant={viewMode === mode ? "filled" : "outlined"}
                sx={modeChipSx(viewMode === mode, mainColor)}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={prevNav} sx={{ p: 0.25 }} aria-label={t.sharedUi.previous}>
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 72, textAlign: "center", fontSize: 11 }}>
              {viewMode === "day" ? `${monthNames[navDate.getMonth()]} ${navDate.getFullYear()}` : navDate.getFullYear()}
            </Typography>
            <IconButton size="small" onClick={nextNav} sx={{ p: 0.25 }} aria-label={t.sharedUi.next}>
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {viewMode === "day" ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
                {dayNames.map((d, i) => (
                  <Typography key={i} variant="caption" align="center" sx={{ fontWeight: 700, color: "text.disabled", fontSize: 9, display: "block" }}>{d}</Typography>
                ))}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                {Array.from({ length: startOffset }).map((_, i) => <Box key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const val = dayMap.get(day) || 0;
                  const sel = isSelDay(day);
                  const tod = isToday(day);
                  return (
                    <Box
                      key={day}
                      onClick={() => handleDayClick(day)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleDayClick(day)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${day} ${monthNames[navDate.getMonth()]}`}
                      sx={dayCellSx({ sel, today: tod, val, max: maxDay, main: mainColor })}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
              <Box sx={heatLegendSx}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>{t.sharedUi.less}</Typography>
                {[0.1, 0.3, 0.55, 0.75, 0.9].map((o) => (
                  <Box key={o} sx={{ width: 8, height: 8, borderRadius: 0.25, bgcolor: alpha(mainColor, o) }} />
                ))}
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>{t.sharedUi.more}</Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5 }}>
              {monthNames.map((name, month) => {
                const val = monthMap.get(month) || 0;
                const sel = isSelMonth(month);
                const cur = isCurMonth(month);
                return (
                  <Box
                    key={month}
                    onClick={() => handleMonthClick(month)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleMonthClick(month)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name} ${navDate.getFullYear()}`}
                    sx={monthCellSx({ sel, current: cur, val, max: maxMonth, main: mainColor })}
                  >
                    <Typography variant="caption" sx={monthNameSx(sel)}>{name}</Typography>
                    {val > 0 && (
                      <Typography variant="caption" sx={monthAmountSx(sel, mainColor)}>
                        {sign}{fmt(val, true)}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
}
