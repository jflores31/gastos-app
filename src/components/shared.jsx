import { useState, useMemo } from "react";
import { Box, Card, CardContent, Typography, Avatar, Chip, IconButton, Collapse, Paper } from "@mui/material";
import { Inbox as InboxIcon, Receipt as ReceiptIcon, AttachMoney as MoneyIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, CalendarMonth as CalendarIcon } from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import { CATEGORIES, fmtMoney } from "../data/index.js";

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];
const DAYS_EN = ["M", "T", "W", "T", "F", "S", "S"];

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, px: 3, textAlign: "center" }}>
      <Avatar sx={{ width: 64, height: 64, bgcolor: "grey.100", color: "grey.400", mb: 2 }}>
        {icon || <InboxIcon sx={{ fontSize: 32 }} />}
      </Avatar>
      <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>
          {subtitle}
        </Typography>
      )}
      {action}
    </Box>
  );
}

export function NoTransactions({ lang, type = "expense" }) {
  const isExpense = type === "expense";
  return (
    <EmptyState 
      icon={isExpense ? <ReceiptIcon sx={{ fontSize: 32 }} /> : <MoneyIcon sx={{ fontSize: 32 }} />}
      title={lang === "es" ? (isExpense ? "Sin gastos" : "Sin ingresos") : (isExpense ? "No expenses" : "No income")}
      subtitle={lang === "es" ? "Agrega tu primera transacción" : "Add your first transaction"}
    />
  );
}

export function StatsCard({ title, subtitle, icon, iconColor = "primary", children, borderColor = "divider", topBorderColor = "primary.main", minHeight = "auto", onClick }) {
  return (
    <Card 
      onClick={onClick}
      sx={{ 
        borderRadius: 2, 
        border: "1px solid", 
        borderColor: borderColor,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": onClick ? { boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transform: "translateY(-2px)", cursor: "pointer" } : {},
        borderTop: "4px solid",
        borderTopColor: topBorderColor,
        bgcolor: "background.paper",
        minHeight: minHeight,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2.5 } }}>
        {(title || icon) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            {icon && (
              <Avatar sx={{ width: 40, height: 40, bgcolor: `${iconColor}.light`, color: `${iconColor}.dark` }}>
                {icon}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              {title && <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>}
              {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
          </Box>
        )}
        <Box sx={{ flex: 1 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

export function Delta({ value, invert }) {
  const positive = invert ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "—";
  return (
    <span className="delta" data-positive={positive} data-zero={value === 0}>
      <span className="delta-arrow">{arrow}</span> {sign}{value.toFixed(1)}%
    </span>
  );
}

export function SummaryCard({ label, value, delta, sub, invert, color, icon }) {
  return (
    <div className="st-sum" data-color={color}>
      <div className="st-sum-top"><span className="st-sum-icon">{icon}</span><span className="st-sum-label">{label}</span></div>
      <div className="st-sum-value">{value}</div>
      <div className="st-sum-meta">
        {delta != null && <Delta value={delta} invert={invert} />}
        {sub && <span className="st-sum-sub">{sub}</span>}
      </div>
    </div>
  );
}

export function CalendarFilter({ txs, tipo, onFilter, lang, currency }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("day");
  const [navDate, setNavDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const mainColor = tipo === "EGRESO" ? theme.palette.error.main : theme.palette.success.main;
  const sign = tipo === "EGRESO" ? "−" : "+";
  const monthNames = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const dayNames = lang === "es" ? DAYS_ES : DAYS_EN;

  const dayMap = useMemo(() => {
    const m = new Map();
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
    const m = new Map();
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

  const handleDayClick = (day) => {
    const date = new Date(navDate.getFullYear(), navDate.getMonth(), day);
    const isSame = selected?.type === "day" && selected.date.toDateString() === date.toDateString();
    if (isSame) { clearFilter(); return; }
    const f = { type: "day", date };
    setSelected(f); onFilter(f); setOpen(false);
  };

  const handleMonthClick = (month) => {
    const date = new Date(navDate.getFullYear(), month, 1);
    const isSame = selected?.type === "month" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === month;
    if (isSame) { clearFilter(); return; }
    const f = { type: "month", date };
    setSelected(f); onFilter(f); setOpen(false);
  };

  const isSelDay = (day) => selected?.type === "day" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === navDate.getMonth() && selected.date.getDate() === day;
  const isSelMonth = (m) => selected?.type === "month" && selected.date.getFullYear() === navDate.getFullYear() && selected.date.getMonth() === m;
  const isToday = (day) => today.getDate() === day && today.getMonth() === navDate.getMonth() && today.getFullYear() === navDate.getFullYear();
  const isCurMonth = (m) => today.getMonth() === m && today.getFullYear() === navDate.getFullYear();

  const selectedLabel = selected
    ? selected.type === "day"
      ? selected.date.toLocaleDateString(lang === "es" ? "es-PE" : "en-US", { day: "numeric", month: "short" })
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
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: mainColor, color: "#fff", cursor: "pointer", "& .MuiChip-icon": { color: "rgba(255,255,255,0.85)" }, "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.75)", "&:hover": { color: "#fff" } } }}
          />
        ) : (
          <Chip
            size="small"
            icon={<CalendarIcon sx={{ fontSize: "14px !important" }} />}
            label={lang === "es" ? "Filtrar por fecha" : "Filter by date"}
            onClick={() => setOpen((o) => !o)}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: 11, borderColor: "divider", color: "text.secondary", cursor: "pointer", "&:hover": { borderColor: mainColor, color: mainColor } }}
          />
        )}
      </Box>

      {/* Collapsible calendar panel */}
      <Collapse in={open} unmountOnExit>
        <Paper elevation={0} sx={{ mt: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, maxWidth: 288 }}>
          {/* View mode tabs */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, alignItems: "center" }}>
            {["day", "month"].map((mode) => (
              <Chip
                key={mode}
                size="small"
                label={mode === "day" ? (lang === "es" ? "Día" : "Day") : (lang === "es" ? "Mes" : "Month")}
                aria-label={mode === "day" ? (lang === "es" ? "Ver por día" : "View by day") : (lang === "es" ? "Ver por mes" : "View by month")}
                onClick={() => { setViewMode(mode); clearFilter(); setOpen(true); }}
                variant={viewMode === mode ? "filled" : "outlined"}
                sx={{ fontWeight: 600, fontSize: 10, height: 20, bgcolor: viewMode === mode ? mainColor : undefined, color: viewMode === mode ? "#fff" : "text.secondary", borderColor: viewMode === mode ? mainColor : "divider", "&:hover": { opacity: 0.85 } }}
              />
            ))}
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" onClick={prevNav} sx={{ p: 0.25 }} aria-label={lang === "es" ? "Anterior" : "Previous"}>
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 72, textAlign: "center", fontSize: 11 }}>
              {viewMode === "day" ? `${monthNames[navDate.getMonth()]} ${navDate.getFullYear()}` : navDate.getFullYear()}
            </Typography>
            <IconButton size="small" onClick={nextNav} sx={{ p: 0.25 }} aria-label={lang === "es" ? "Siguiente" : "Next"}>
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
                      role="button"
                      aria-label={`${day} ${monthNames[navDate.getMonth()]}`}
                      sx={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 0.75,
                        cursor: "pointer",
                        bgcolor: sel ? mainColor : val > 0 ? alpha(mainColor, 0.12 + (val / maxDay) * 0.7) : "transparent",
                        outline: tod && !sel ? `1.5px solid ${mainColor}` : "none",
                        outlineOffset: -1,
                        color: sel ? "#fff" : "text.primary",
                        fontWeight: val > 0 ? 600 : 400,
                        fontSize: 10,
                        transition: "opacity 0.12s, transform 0.12s, background-color 0.12s",
                        userSelect: "none",
                        "&:hover": { opacity: 0.75, transform: "scale(1.08)" },
                      }}
                    >
                      {day}
                    </Box>
                  );
                })}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1, justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>{lang === "es" ? "Menos" : "Less"}</Typography>
                {[0.1, 0.3, 0.55, 0.75, 0.9].map((o) => (
                  <Box key={o} sx={{ width: 8, height: 8, borderRadius: 0.25, bgcolor: alpha(mainColor, o) }} />
                ))}
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 9 }}>{lang === "es" ? "Más" : "More"}</Typography>
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
                    role="button"
                    aria-label={`${name} ${navDate.getFullYear()}`}
                    sx={{
                      py: 1, px: 0.25,
                      borderRadius: 1,
                      cursor: "pointer",
                      bgcolor: sel ? mainColor : val > 0 ? alpha(mainColor, 0.12 + (val / maxMonth) * 0.7) : "transparent",
                      outline: cur && !sel ? `1.5px solid ${mainColor}` : "none",
                      outlineOffset: -1,
                      textAlign: "center",
                      transition: "opacity 0.12s, background-color 0.12s",
                      userSelect: "none",
                      "&:hover": { opacity: 0.75 },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", color: sel ? "#fff" : "text.primary", fontSize: 10 }}>{name}</Typography>
                    {val > 0 && (
                      <Typography variant="caption" sx={{ display: "block", color: sel ? "rgba(255,255,255,0.8)" : mainColor, fontWeight: 600, fontSize: 8, lineHeight: 1.2, mt: 0.25 }}>
                        {sign}{fmtMoney(val, currency, true)}
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

export function TxTable({ txs, lang, currency, t }) {
  if (!txs.length) return <div className="st-tx-empty">{lang === "es" ? "No hay transacciones para mostrar" : "No transactions to show"}</div>;
  return (
    <div className="st-tx-table">
      <div className="st-tx-head">
        <span>{t.date}</span><span>{t.category}</span><span>{t.concept}</span>
        <span style={{ textAlign: "right" }}>{t.amount}</span>
      </div>
      <div className="st-tx-body">
        {txs.map((x) => {
          const expColor = CATEGORIES.expense[x.categoria]?.color;
          const color    = expColor || "var(--income)";
          const catName  = CATEGORIES.expense[x.categoria]?.[lang] || CATEGORIES.income[x.categoria]?.[lang] || x.categoria;
          return (
            <div key={x.id} className="st-tx-row" data-anom={x.anomaly}>
              <div className="st-tx-date"><div className="st-tx-d">{x.dia}</div><div className="st-tx-m">{t.months[x.mes]}</div></div>
              <div className="st-tx-cat">
                <i style={{ background: `color-mix(in oklch, ${expColor || "#9e9e9e"} 18%, transparent)`, color }}>
                  {catName.slice(0, 1)}
                </i>
                <div className="st-tx-con">
                  <span>{catName}</span>
                  {x.anomaly && <span className="st-tx-flag">⚠ {t.unusual}</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{x.concepto}</div>
              <div className="st-tx-amt" data-tipo={x.tipo}>
                {x.tipo === "INGRESO" ? "+" : "−"}{fmtMoney(x.valor, currency, true)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}