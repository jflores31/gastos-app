export function Donut({ slices, size = 180, thickness = 22, gap = 2 }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const items = slices.map((s, i) => {
    const offset = slices.slice(0, i).reduce((acc, prev) => acc + c * (prev.value / total), 0);
    const frac = s.value / total;
    const len = c * frac - gap;
    const dash = `${Math.max(0, len)} ${c}`;
    return { key: i, color: s.color, dash, dashOffset: -offset };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', maxWidth: size }}>
      <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
        {items.map(({ key, color, dash, dashOffset }) => (
          <circle key={key} r={r} fill="none" stroke={color}
            strokeWidth={thickness} strokeDasharray={dash}
            strokeDashoffset={dashOffset} />
        ))}
      </g>
    </svg>
  );
}

export function MiniBarLabeled({ data }) {
  if (!data || !data.length) return null;
  const W = 500, BARH = 48, TEXTH = 18, H = BARH + TEXTH;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slotW = W / data.length;
  const barW = slotW * 0.6;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {data.map((d, i) => {
        const barH = Math.max(3, (d.value / max) * BARH);
        const x = i * slotW + (slotW - barW) / 2;
        const cx = i * slotW + slotW / 2;
        const label = d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label;
        return (
          <g key={i}>
            <rect x={x} y={BARH - barH} width={barW} height={barH} fill={d.color} rx={2} opacity={0.72} />
            <text x={cx} y={H - 2} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.5"
              style={{ fontFamily: "Inter, Roboto, sans-serif" }}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SparkBar({ data, color = "var(--accent)" }) {
  if (!data || !data.length) return null;
  const W = 600, H = 56;
  const max = Math.max(...data, 1);
  const slotW = W / data.length;
  const barW = slotW * 0.65;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "40px", display: "block" }}>
      {data.map((v, i) => {
        const barH = Math.max(2, (v / max) * H);
        return (
          <rect
            key={i}
            x={i * slotW + (slotW - barW) / 2}
            y={H - barH}
            width={barW}
            height={barH}
            fill={color}
            rx={2}
            opacity={i === data.length - 1 ? 0.9 : 0.4}
          />
        );
      })}
    </svg>
  );
}

export function SparkArea({ data }) {
  if (!data || !data.length) return null;
  const W = 600, H = 64;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = W / Math.max(1, data.length - 1);
  const points = data.map((v, i) => [i * stepX, H - ((v - min) / range) * H * 0.85 - H * 0.1]);
  const path = points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="st-spark" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + ` L ${W},${H} L 0,${H} Z`} fill="url(#sg)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}

export function StudioCashflow({ months, t }) {
  if (!months.length) return null;
  const W = 720, H = 240, P = 36;
  const max = Math.max(...months.map((m) => Math.max(m.ingreso, m.egreso)), 1);
  const stepX = (W - P * 2) / Math.max(1, months.length - 1);
  const yFor = (v) => H - P - (v / max) * (H - P * 2);
  const ins = months.map((m) => m.ingreso);
  const outs = months.map((m) => m.egreso);
  const nets = months.map((m) => m.ingreso - m.egreso);
  const line = (arr) => arr.map((v, i) => (i ? "L" : "M") + (P + i * stepX) + "," + yFor(v)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="st-flow-svg" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="ginc" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--income)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--income)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gexp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--expense)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--expense)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={P} x2={W - P} y1={H - P - g * (H - P * 2)} y2={H - P - g * (H - P * 2)}
          stroke="currentColor" opacity="0.06" />
      ))}
      <path d={line(ins) + ` L ${W - P} ${H - P} L ${P} ${H - P} Z`} fill="url(#ginc)" />
      <path d={line(outs) + ` L ${W - P} ${H - P} L ${P} ${H - P} Z`} fill="url(#gexp)" />
      <path d={line(ins)} fill="none" stroke="var(--income)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(outs)} fill="none" stroke="var(--expense)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(nets)} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
      {months.map((m, i) => (
        <g key={i}>
          {i === months.length - 1 && (
            <>
              <circle cx={P + i * stepX} cy={yFor(m.ingreso)} r="5" fill="var(--bg)" stroke="var(--income)" strokeWidth="2" />
              <circle cx={P + i * stepX} cy={yFor(m.egreso)} r="5" fill="var(--bg)" stroke="var(--expense)" strokeWidth="2" />
            </>
          )}
          <text x={P + i * stepX} y={H - 12} textAnchor="middle" fontSize="11"
            fill="currentColor" opacity="0.5" style={{ fontFamily: "Inter, Roboto, sans-serif" }}>
            {t.months[m.mes] || ""}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HeatCalendar({ values, days = 84, color = "currentColor", cellSize = 10, gap = 2 }) {
  const today = new Date();
  const start = new Date(today); start.setDate(today.getDate() - days + 1);
  const startDow = (start.getDay() + 6) % 7;
  const map = new Map(values.map((v) => [v.date.toDateString(), v.value]));
  let maxV = 1;
  for (const v of values) if (v.value > maxV) maxV = v.value;
  const cells = [];
  for (let i = 0; i < days + startDow; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i - startDow);
    if (i < startDow) { cells.push({ empty: true }); continue; }
    const v = map.get(d.toDateString()) || 0;
    cells.push({ date: d, value: v, intensity: v / maxV });
  }
  const cols = Math.ceil(cells.length / 7);
  return (
    <svg width={cols * (cellSize + gap)} height={7 * (cellSize + gap)}>
      {cells.map((c, i) => {
        const col = Math.floor(i / 7);
        const row = i % 7;
        if (c.empty) return null;
        const op = c.value === 0 ? 0.06 : 0.15 + c.intensity * 0.85;
        return (
          <rect key={i} x={col * (cellSize + gap)} y={row * (cellSize + gap)}
            width={cellSize} height={cellSize} fill={color} opacity={op} rx={1} />
        );
      })}
    </svg>
  );
}

