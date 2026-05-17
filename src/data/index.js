export const I18N = {
  es: {
    income: "Ingresos", expense: "Egresos", net: "Neto", balance: "Balance",
    budget: "Presupuesto", spent: "Gastado", remaining: "Restante", overspent: "Excedido",
    savings: "Ahorro", rate: "Tasa", forecast: "Proyección", actual: "Real",
    month: "Mes", year: "Año", quarter: "Trimestre", week: "Semana", day: "Día", today: "Hoy",
    category: "Categoría", concept: "Concepto", amount: "Monto", date: "Fecha", type: "Tipo",
    transactions: "Transacciones", recent: "Recientes", all: "Todas",
    topCategories: "Top categorías", topConcepts: "Conceptos principales",
    cashflow: "Flujo de caja", trend: "Tendencia", breakdown: "Desglose",
    budgetVsActual: "Presupuesto vs. Real", anomalies: "Anomalías", insights: "Insights",
    recurring: "Recurrentes", goals: "Metas", networth: "Patrimonio",
    heatmap: "Mapa de calor", search: "Buscar", filter: "Filtrar", export: "Exportar",
    addTx: "Nueva transacción", suggested: "Sugeridas", new: "Nuevo",
    vsLastMonth: "vs. mes anterior", vsLastYear: "vs. año anterior", vsAvg: "vs. promedio",
    avgDaily: "Promedio diario", avgMonthly: "Promedio mensual", projected: "Proyectado",
    overBudget: "Sobre presupuesto", onTrack: "Dentro de presupuesto", under: "Bajo",
    selectCategory: "Seleccionar categoría", enterConcept: "Ingresar concepto",
    enterAmount: "Ingresar monto", save: "Guardar", cancel: "Cancelar",
    months: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    monthsLong: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    days: ["L","M","X","J","V","S","D"],
    overview: "Resumen", expenses: "Gastos", incomes: "Ingresos",
    spending: "Gasto", earning: "Ingreso", saving: "Ahorrado",
    healthScore: "Salud financiera", emergencyFund: "Fondo de emergencia",
    debt: "Deudas", debtPayoff: "Liquidación de deudas",
    upcoming: "Próximos", unusual: "Inusual", normal: "Normal",
    aiInsight: "Análisis IA", askAI: "Preguntar a la IA",
    higher: "más alto", lower: "más bajo", ofBudget: "del presupuesto",
    vsExpected: "vs. esperado", note: "Nota", tag: "Etiqueta",
    family: "Familia", member: "Miembro", account: "Cuenta",
    cash: "Efectivo", bank: "Banco", card: "Tarjeta",
    months_full: "los últimos 12 meses",
    dailyTitle: "Gastos Diarios", dailySubtitle: "Registra tus gastos del día por categoría",
    todaysExpenses: "Gastos de hoy", runway: "Runway", days_left: "días", you: "Tú",
  },
  en: {
    income: "Income", expense: "Expense", net: "Net", balance: "Balance",
    budget: "Budget", spent: "Spent", remaining: "Remaining", overspent: "Over",
    savings: "Savings", rate: "Rate", forecast: "Forecast", actual: "Actual",
    month: "Month", year: "Year", quarter: "Quarter", week: "Week", day: "Day", today: "Today",
    category: "Category", concept: "Concept", amount: "Amount", date: "Date", type: "Type",
    transactions: "Transactions", recent: "Recent", all: "All",
    topCategories: "Top categories", topConcepts: "Top concepts",
    cashflow: "Cash flow", trend: "Trend", breakdown: "Breakdown",
    budgetVsActual: "Budget vs. Actual", anomalies: "Anomalies", insights: "Insights",
    recurring: "Recurring", goals: "Goals", networth: "Net worth",
    heatmap: "Heat map", search: "Search", filter: "Filter", export: "Export",
    addTx: "New transaction", suggested: "Suggested", new: "New",
    vsLastMonth: "vs. last month", vsLastYear: "vs. last year", vsAvg: "vs. average",
    avgDaily: "Daily avg", avgMonthly: "Monthly avg", projected: "Projected",
    overBudget: "Over budget", onTrack: "On track", under: "Under",
    selectCategory: "Select category", enterConcept: "Enter concept",
    enterAmount: "Enter amount", save: "Save", cancel: "Cancel",
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    monthsLong: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    days: ["M","T","W","T","F","S","S"],
    overview: "Overview", expenses: "Expenses", incomes: "Income",
    spending: "Spending", earning: "Earning", saving: "Saved",
    healthScore: "Financial health", emergencyFund: "Emergency fund",
    debt: "Debt", debtPayoff: "Debt payoff",
    upcoming: "Upcoming", unusual: "Unusual", normal: "Normal",
    aiInsight: "AI Insight", askAI: "Ask AI",
    higher: "higher", lower: "lower", ofBudget: "of budget",
    vsExpected: "vs. expected", note: "Note", tag: "Tag",
    family: "Family", member: "Member", account: "Account",
    cash: "Cash", bank: "Bank", card: "Card",
    months_full: "trailing 12 months",
    dailyTitle: "Daily Expenses", dailySubtitle: "Record your daily expenses by category",
    todaysExpenses: "Today's Expenses", runway: "Runway", days_left: "days", you: "You",
  }
};

export const CATEGORIES = {
  income: {
    SUELDO:          { es: "Sueldo",                    en: "Salary",              color: "#5a9bc9", concepts: ["SUELDO POR PLANILLA", "SUELDO BASE"] },
    HONORARIOS:      { es: "Honorarios / freelance",     en: "Freelance",           color: "#7b68ee", concepts: ["FREELANCE", "CONSULTORIA"] },
    NEGOCIO:         { es: "Negocio propio",             en: "Own business",        color: "#7ab87a", concepts: ["VENTAS", "CONSULTORIA"] },
    INVERSIONES:     { es: "Inversiones",                en: "Investments",         color: "#4a90d9", concepts: ["RENDIMIENTOS", "GANANCIAS"] },
    INTERESES:       { es: "Intereses bancarios",        en: "Bank interest",       color: "#88b04b", concepts: ["INTERESES", "DIVIDENDOS"] },
    ALQUILERES:      { es: "Alquileres",                 en: "Rentals",             color: "#a87cc4", concepts: ["ALQUILER DE INMUEBLE"] },
    VENTAS:          { es: "Ventas por internet",         en: "Online sales",       color: "#ff6f61", concepts: ["MARKETPLACE", "VENTAS"] },
    CONTENIDO:       { es: "Creación de contenido",      en: "Content creation",   color: "#e74c3c", concepts: ["YOUTUBE", "TIKTOK", "INSTAGRAM"] },
    GAMING:          { es: "Streaming / gaming",          en: "Streaming / gaming", color: "#2ecc71", concepts: ["STREAM", "DONACIONES"] },
    CLASES:          { es: "Clases particulares",        en: "Private lessons",    color: "#3498db", concepts: ["TUTORIAS", "CLASES"] },
    ASESORIAS:       { es: "Asesorías",                  en: "Consulting",         color: "#1abc9c", concepts: ["ASESORIA", "CONSULTORIA"] },
    TECNICO:         { es: "Trabajos técnicos",           en: "Technical work",     color: "#95a5a6", concepts: ["MANTENIMIENTO", "REPARACION"] },
    TELECOM:         { es: "Servicios de telecomunicaciones", en: "Telecom services", color: "#f39c12", concepts: ["SERVICIOS", "INSTALACION"] },
    MUSICA:          { es: "Música / presentaciones",    en: "Music / performances",color: "#e91e63", concepts: ["PRESENTACIONES", "TOCADAS"] },
    EVENTOS:         { es: "Eventos / animación",         en: "Events / animation",  color: "#9c27b0", concepts: ["EVENTOS", "ANIMACION"] },
    DJ:              { es: "DJ / sonido",                en: "DJ / sound",          color: "#673ab7", concepts: ["DJ", "SONIDO"] },
    TOCADAS:         { es: "Tocadas en vivo",            en: "Live gigs",          color: "#f44336", concepts: ["TOCADAS", "CONCIERTOS"] },
    PRODUCCION:      { es: "Producción de eventos",      en: "Event production",   color: "#ff5722", concepts: ["PRODUCCION", "ORGANIZACION"] },
    FOTOGRAFIA:      { es: "Fotografía y video para eventos", en: "Photo / video",    color: "#795548", concepts: ["FOTOS", "VIDEO", "EVENTOS"] },
    EDICION:         { es: "Edición audiovisual",        en: "Video editing",      color: "#607d8b", concepts: ["EDICION", "VIDEO"] },
    ORGANIZACION:    { es: "Organización de conciertos / fiestas", en: "Concert / party org", color: "#ff9800", concepts: ["CONCIERTOS", "FIESTAS"] },
    ALQUILER_SONIDO: { es: "Alquiler de sonido e iluminación", en: "Sound / lighting rental", color: "#009688", concepts: ["ALQUILER", "SONIDO", "ILUMINACION"] },
    EVENTOS_CORP:    { es: "Eventos corporativos / sociales", en: "Corporate / social events", color: "#00bcd4", concepts: ["CORPORATIVO", "SOCIAL"] },
    COMISIONES:      { es: "Comisiones",                 en: "Commissions",        color: "#2980b9", concepts: ["COMISION", "BONO"] },
    REGALOS:         { es: "Regalos / apoyo familiar",  en: "Gifts / family support", color: "#e91e63", concepts: ["REGALOS", "APOYO"] },
    CRIPTO:          { es: "Cripto / trading",           en: "Crypto / trading",   color: "#ff9800", concepts: ["CRIPTO", "TRADING"] },
    DIVIDENDOS:      { es: "Dividendos",                 en: "Dividends",          color: "#4caf50", concepts: ["DIVIDENDOS", "ACCIONES"] },
    BONOS:           { es: "Bonos laborales",            en: "Work bonuses",       color: "#2196f3", concepts: ["BONO", "AGUINALDO"] },
    CASHBACK:        { es: "Cashback / recompensas",    en: "Cashback",           color: "#00bcd4", concepts: ["CASHBACK", "PUNTOS"] },
    AHORROS:         { es: "Ahorros_retirados",          en: "Savings withdrawn",  color: "#795548", concepts: ["RETIRO", "AHORRO"] },
  },
  expense: {
    VIVIENDA:       { es: "Alquiler / Hipoteca", en: "Rent / Mortgage",  color: "#c9a55a", concepts: ["ALQUILER"] },
    LUZ:            { es: "Luz",                 en: "Electricity",      color: "#f5a623", concepts: ["FACTURA LUZ"] },
    AGUA:           { es: "Agua",                en: "Water",           color: "#4a90d9", concepts: ["FACTURA AGUA"] },
    INTERNET:       { es: "Internet",            en: "Internet",        color: "#6b5b95", concepts: ["WIFI", "PLAN"] },
    CELULAR:        { es: "Celular",             en: "Phone",           color: "#88b04b", concepts: ["PLAN", "RECARGA"] },
    COMIDA:         { es: "Comida",              en: "Food",            color: "#7ab87a", concepts: ["MERCADO", "SUPERMERCADO"] },
    TRANSPORTE:     { es: "Transporte",          en: "Transport",       color: "#f08080", concepts: ["BUS", "METRO", "TAXI", "UBER"] },
    GASOLINA:       { es: "Gasolina",            en: "Gasoline",        color: "#ff6f61", concepts: ["GASOLINA", "NAFTA"] },
    AUTO:           { es: "Mantenimiento auto",  en: "Car maintenance", color: "#a57c52", concepts: ["MANTENIMIENTO", "MECANICO"] },
    MOTO:           { es: "Mantenimiento moto",  en: "Bike maintenance",color: "#7a9fc4", concepts: ["MANTENIMIENTO", "MECANICO MOTO"] },
    REPUESTOS:      { es: "Repuestos",           en: "Parts",           color: "#c49a6c", concepts: ["REPUESTOS", "ACCESORIOS"] },
    LLANTAS:        { es: "Llantas",             en: "Tires",           color: "#4a4a4a", concepts: ["NEUMATICOS"] },
    ACEITE:         { es: "Cambio de aceite",    en: "Oil change",      color: "#d4af37", concepts: ["ACEITE", "LUBRICANTE"] },
    SOAT:           { es: "SOAT / Seguro",      en: "Insurance",      color: "#9b2335", concepts: ["SOAT", "SEGURO"] },
    ESTACIONAMIENTO:{ es: "Estacionamiento",    en: "Parking",        color: "#8c8c8c", concepts: ["PARKING", "PLAYA"] },
    STREAMING:      { es: "Streaming",           en: "Streaming",       color: "#e91e63", concepts: ["NETFLIX", "SPOTIFY", "DISNEY"] },
    CAFES:          { es: "Cafés y antojos",    en: "Coffee & snacks", color: "#795548", concepts: ["CAFE", "BEBIDAS", "SNACKS"] },
    ROPA:           { es: "Ropa",                en: "Clothing",        color: "#ff7f50", concepts: ["ROPA", "ZAPATOS"] },
    SALUD:          { es: "Salud y farmacias",   en: "Health & pharmacy",color: "#00bcd4", concepts: ["MEDICINAS", "MEDICO", "CLINICA"] },
    DEUDAS:         { es: "Deudas / Préstamos",  en: "Debt / Loans",    color: "#c95a5a", concepts: ["PRESTAMO", "CUOTA"] },
    EDUCACION:      { es: "Educación",          en: "Education",      color: "#9c27b0", concepts: ["CURSOS", "LIBROS", "INSCRIPCION"] },
    MASCOTA:        { es: "Mascotas",            en: "Pets",            color: "#b8a87a", concepts: ["VETERINARIO", "ALIMENTO", "ACCESORIOS"] },
    REGALOS:        { es: "Regalos",             en: "Gifts",           color: "#e91e63", concepts: ["CUMPLEAÑOS", "REGALOS"] },
    IMPREVISTOS:    { es: "Imprevistos",        en: "Unexpected",     color: "#ff5722", concepts: ["IMPREVISTOS", "EMERGENCIAS"] },
    AHORRO:         { es: "Ahorro",              en: "Savings",        color: "#4caf50", concepts: ["AHORRO", "DEPOSITO"] },
    DELIVERY:       { es: "Delivery",           en: "Delivery",       color: "#ff9800", concepts: ["COMIDA A DOMICILIO"] },
    JUEGOS:         { es: "Juegos / Apps",      en: "Games / Apps",   color: "#673ab7", concepts: ["JUEGOS", "SKINS", "APPS"] },
    SALIDAS:        { es: "Salidas y diversión", en: "Going out",      color: "#ff4081", concepts: ["BARES", "RESTAURANT", "CINE"] },
    HIGIENE:        { es: "Higiene personal",   en: "Personal care",  color: "#009688", concepts: ["JABONES", "CREMAS", "PELUQUERIA"] },
    GIMNASIO:       { es: "Gimnasio",           en: "Gym",            color: "#f44336", concepts: ["MEMBRESIA", "GIMNASIO"] },
    VIAJES:         { es: "Viajes",             en: "Travel",         color: "#03a9f4", concepts: ["HOTEL", "BOLETOS", "TURISMO"] },
    IMPUESTOS:      { es: "Impuestos",          en: "Taxes",          color: "#607d8b", concepts: ["IMPUESTOS", "COMISIONES"] },
    COMPRAS:        { es: "Compras varias",    en: "Misc shopping",  color: "#8a8a8a", concepts: ["VARIOS", "OTROS"] },
  }
};

export const BUDGETS = {
  VIVIENDA: 1800, LUZ: 150, AGUA: 80, INTERNET: 120, CELULAR: 80,
  COMIDA: 1400, TRANSPORTE: 200, GASOLINA: 300, AUTO: 250, MOTO: 150,
  REPUESTOS: 100, LLANTAS: 80, ACEITE: 60, SOAT: 100, ESTACIONAMIENTO: 80,
  STREAMING: 60, CAFES: 100, ROPA: 150, SALUD: 200, DEUDAS: 900,
  EDUCACION: 300, MASCOTA: 150, REGALOS: 100, IMPREVISTOS: 200,
  AHORRO: 500, DELIVERY: 150, JUEGOS: 50, SALIDAS: 200, HIGIENE: 100,
  GIMNASIO: 80, VIAJES: 150, IMPUESTOS: 100, COMPRAS: 100,
};

export const CURRENCIES = {
  PEN: { symbol: "S/", code: "PEN", name: "Sol Peruano", rate: 1 },
  USD: { symbol: "$",  code: "USD", name: "US Dollar",   rate: 0.27 },
  EUR: { symbol: "€",  code: "EUR", name: "Euro",        rate: 0.25 },
  MXN: { symbol: "$",  code: "MXN", name: "Peso MXN",   rate: 5.0 },
  COP: { symbol: "$",  code: "COP", name: "Peso COP",   rate: 1100 },
  ARS: { symbol: "$",  code: "ARS", name: "Peso ARS",   rate: 320 },
  CLP: { symbol: "$",  code: "CLP", name: "Peso CLP",   rate: 250 },
  BRL: { symbol: "R$", code: "BRL", name: "Real BRL",   rate: 1.5 },
};

export function fmtMoney(v, curr = "PEN", compact = false) {
  const c = CURRENCIES[curr] || CURRENCIES.PEN;
  const n = v * c.rate;
  if (compact) {
    if (Math.abs(n) >= 1e6) return c.symbol + (n / 1e6).toFixed(1) + "M";
    if (Math.abs(n) >= 1e3) return c.symbol + (n / 1e3).toFixed(1) + "k";
  }
  return c.symbol + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: n >= 100 ? 0 : 2 });
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getToday() {
  return new Date();
}

export function generateTransactions() {
  const rng = mulberry32(42);
  const txs = [];
  const today = getToday();
  const startMonth = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  let id = 0;

  for (let m = 0; m < 13; m++) {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + m, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    txs.push(mk(id++, "INGRESO", "SUELDO", "SUELDO POR PLANILLA", 2, monthDate, 4500 + Math.round(rng() * 100)));
    if (m % 6 === 5) txs.push(mk(id++, "INGRESO", "BONO", "GRATIFICACION", 15, monthDate, 4500));
    if (m === 6) txs.push(mk(id++, "INGRESO", "BONO", "AGUINALDO", 15, monthDate, 1800));
    if (rng() > 0.3) txs.push(mk(id++, "INGRESO", "MUSICA", rng() > 0.5 ? "EVENTOS" : "CLASES", Math.ceil(rng() * 28), monthDate, 300 + Math.round(rng() * 900)));
    if (rng() > 0.5) txs.push(mk(id++, "INGRESO", "NEGOCIO", "VENTAS", Math.ceil(rng() * 28), monthDate, 200 + Math.round(rng() * 600)));

    txs.push(mk(id++, "EGRESO", "VIVIENDA", "ALQUILER", 5, monthDate, 1700));
    txs.push(mk(id++, "EGRESO", "SERVICIOS", "INTERNET", 8, monthDate, 120));
    txs.push(mk(id++, "EGRESO", "SERVICIOS", "LUZ", 12, monthDate, 95 + Math.round(rng() * 40)));
    txs.push(mk(id++, "EGRESO", "SERVICIOS", "AGUA", 14, monthDate, 60 + Math.round(rng() * 20)));
    txs.push(mk(id++, "EGRESO", "SERVICIOS", "CELULAR", 18, monthDate, 89));
    txs.push(mk(id++, "EGRESO", "DEUDAS", "BCP", 10, monthDate, 380));
    txs.push(mk(id++, "EGRESO", "DEUDAS", "SCOTIABANK", 20, monthDate, 290));
    if (m % 3 === 0) txs.push(mk(id++, "EGRESO", "DEUDAS", "INTERBANK", 25, monthDate, 220));
    txs.push(mk(id++, "EGRESO", "ENTRETENIMIENTO", "STREAMING", 1, monthDate, 45));
    txs.push(mk(id++, "EGRESO", "MASCOTA", "ALIMENTO", 5, monthDate, 140 + Math.round(rng() * 30)));
    if (m % 4 === 0) txs.push(mk(id++, "EGRESO", "MASCOTA", "VETERINARIO", 12, monthDate, 200));

    const foodDays = Math.min(daysInMonth, m === 12 ? today.getDate() : daysInMonth);
    for (let d = 1; d <= foodDays; d++) {
      if (rng() > 0.18) {
        const concepts = ["DESAYUNO", "ALMUERZO", "CENA", "MERCADO"];
        const concept = concepts[Math.floor(rng() * concepts.length)];
        const base = concept === "MERCADO" ? 80 + rng() * 120 : 12 + rng() * 30;
        txs.push(mk(id++, "EGRESO", "COMIDA", concept, d, monthDate, Math.round(base)));
      }
    }
    const outings = 4 + Math.floor(rng() * 5);
    for (let k = 0; k < outings; k++) {
      const d = 1 + Math.floor(rng() * foodDays);
      txs.push(mk(id++, "EGRESO", "ENTRETENIMIENTO", rng() > 0.5 ? "SALIDAS" : "PASEOS", d, monthDate, 30 + Math.round(rng() * 180)));
    }
    txs.push(mk(id++, "EGRESO", "HIJAS", "COLEGIO", 5, monthDate, 850));
    if (rng() > 0.5) txs.push(mk(id++, "EGRESO", "HIJAS", "UTILES", Math.ceil(rng() * 28), monthDate, 50 + Math.round(rng() * 150)));
    if (m % 3 === 1) txs.push(mk(id++, "EGRESO", "HIJAS", "ROPA", Math.ceil(rng() * 28), monthDate, 180 + Math.round(rng() * 120)));
    const others = 2 + Math.floor(rng() * 4);
    for (let k = 0; k < others; k++) {
      const d = 1 + Math.floor(rng() * foodDays);
      const concepts = ["GASTOS MOTO", "FARMACIA", "REGALOS"];
      txs.push(mk(id++, "EGRESO", "OTROS", concepts[Math.floor(rng() * 3)], d, monthDate, 20 + Math.round(rng() * 200)));
    }
    if (m === 9) txs.push(mk(id++, "EGRESO", "MASCOTA", "VETERINARIO", 18, monthDate, 1850, true));
    if (m === 11) txs.push(mk(id++, "EGRESO", "VIVIENDA", "MANTENIMIENTO", 22, monthDate, 1200, true));
  }

  function mk(id, tipo, categoria, concepto, dia, monthDate, valor, anomaly = false) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), dia);
    return { id, tipo, categoria, concepto, dia, mes: monthDate.getMonth(), año: monthDate.getFullYear(), date, valor, anomaly };
  }

  return txs.filter((t) => t.date <= today).sort((a, b) => a.date - b.date);
}

export function txByMonth(txs) {
  const m = new Map();
  for (const t of txs) {
    const k = `${t.año}-${String(t.mes).padStart(2, "0")}`;
    if (!m.has(k)) m.set(k, { key: k, año: t.año, mes: t.mes, ingreso: 0, egreso: 0, txs: [] });
    const e = m.get(k);
    if (t.tipo === "INGRESO") e.ingreso += t.valor;
    else e.egreso += t.valor;
    e.txs.push(t);
  }
  return [...m.values()].sort((a, b) => a.año - b.año || a.mes - b.mes);
}

export function txByCategory(txs, tipo = "EGRESO") {
  const m = new Map();
  for (const t of txs) if (t.tipo === tipo) {
    if (!m.has(t.categoria)) m.set(t.categoria, { categoria: t.categoria, total: 0, count: 0, txs: [] });
    const e = m.get(t.categoria);
    e.total += t.valor; e.count++; e.txs.push(t);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export function txByCategoryToday(txs) {
  const today = getToday();
  const todayTx = txs.filter((t) => t.date.toDateString() === today.toDateString());
  const m = new Map();
  for (const t of todayTx) if (t.tipo === "EGRESO") {
    if (!m.has(t.categoria)) m.set(t.categoria, { categoria: t.categoria, total: 0, count: 0, concepts: new Map(), txs: [] });
    const cat = m.get(t.categoria);
    cat.total += t.valor; cat.count++; cat.txs.push(t);
    if (!cat.concepts.has(t.concepto)) cat.concepts.set(t.concepto, { concepto: t.concepto, total: 0 });
    cat.concepts.get(t.concepto).total += t.valor;
  }
  return [...m.values()].map((cat) => ({
    ...cat,
    concepts: [...cat.concepts.values()].sort((a, b) => b.total - a.total),
    txs: cat.txs.sort((a, b) => a.date - b.date),
  })).sort((a, b) => b.total - a.total);
}

export function getTodayExpenses(txs) {
  const today = getToday();
  return txs.filter((t) => t.tipo === "EGRESO" && t.date.toDateString() === today.toDateString())
    .sort((a, b) => b.date - a.date);
}

export const SAVINGS_GOALS = [
  { id: "emerg", es: "Fondo de emergencia",  en: "Emergency fund",       target: 18000, current: 12400, deadline: "2026-12-31", color: "#7ab87a", icon: "◉" },
  { id: "viaje", es: "Viaje familiar Cusco",  en: "Cusco family trip",    target: 8500,  current: 5100,  deadline: "2026-09-15", color: "#c9a55a", icon: "✈" },
  { id: "uni",   es: "Universidad hijas",     en: "Daughters' college",   target: 50000, current: 14800, deadline: "2030-03-01", color: "#a87cc4", icon: "▲" },
  { id: "moto",  es: "Moto nueva",            en: "New motorcycle",       target: 12000, current: 9300,  deadline: "2026-08-30", color: "#7a9bc4", icon: "◆" },
];

export const ACCOUNTS = [
  { id: "bcp",   name: "BCP Cuenta Sueldo",  type: "bank", balance: 14250.40, color: "#0033A0" },
  { id: "scoti", name: "Scotiabank Ahorros", type: "bank", balance: 22100.00, color: "#EE1C25" },
  { id: "inter", name: "Interbank CTS",      type: "bank", balance: 8400.20,  color: "#00B0E3" },
  { id: "cash",  name: "Efectivo",           type: "cash", balance: 850.00,   color: "#7ab87a" },
  { id: "tc",    name: "Tarjeta BCP Visa",   type: "card", balance: -3200.50, color: "#0033A0", limit: 8000 },
  { id: "tc2",   name: "Diners Club",        type: "card", balance: -1480.00, color: "#005B9F", limit: 5000 },
];

export const FAMILY_MEMBERS = [
  { id: "yo",     es: "Tú",     en: "You",     avatar: "T", color: "var(--accent)", share: 0.62 },
  { id: "pareja", es: "Pareja", en: "Partner", avatar: "P", color: "#a87cc4",       share: 0.28 },
  { id: "hija1",  es: "Camila", en: "Camila",  avatar: "C", color: "#c9a55a",       share: 0.06 },
  { id: "hija2",  es: "Sofía",  en: "Sofía",   avatar: "S", color: "#7ab87a",       share: 0.04 },
];

export const TRANSACTIONS = generateTransactions();
