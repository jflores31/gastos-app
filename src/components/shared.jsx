import { CATEGORIES, fmtMoney } from "../data/index.js";

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