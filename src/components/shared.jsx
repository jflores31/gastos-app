import { Box, Card, CardContent, Typography, Avatar, Stack } from "@mui/material";
import { Inbox as InboxIcon, Receipt as ReceiptIcon, AttachMoney as MoneyIcon } from "@mui/icons-material";
import { CATEGORIES, fmtMoney } from "../data/index.js";

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
        transition: "all 0.3s",
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
                <i style={{ background: `color-mix(in oklch, ${expColor || "#5a9bc9"} 18%, transparent)`, color }}>
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