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
    TECNICO:         { es: "Trabajos técnicos",           en: "Technical work",     color: "#06B6D4", concepts: ["MANTENIMIENTO", "REPARACION"] },
    TELECOM:         { es: "Servicios de telecomunicaciones", en: "Telecom services", color: "#f39c12", concepts: ["SERVICIOS", "INSTALACION"] },
    MUSICA:          { es: "Música / presentaciones",    en: "Music / performances",color: "#e91e63", concepts: ["PRESENTACIONES", "TOCADAS"] },
    EVENTOS:         { es: "Eventos / animación",         en: "Events / animation",  color: "#9c27b0", concepts: ["EVENTOS", "ANIMACION"] },
    DJ:              { es: "DJ / sonido",                en: "DJ / sound",          color: "#673ab7", concepts: ["DJ", "SONIDO"] },
    TOCADAS:         { es: "Tocadas en vivo",            en: "Live gigs",          color: "#f44336", concepts: ["TOCADAS", "CONCIERTOS"] },
    PRODUCCION:      { es: "Producción de eventos",      en: "Event production",   color: "#ff5722", concepts: ["PRODUCCION", "ORGANIZACION"] },
    FOTOGRAFIA:      { es: "Fotografía y video para eventos", en: "Photo / video",    color: "#795548", concepts: ["FOTOS", "VIDEO", "EVENTOS"] },
    EDICION:         { es: "Edición audiovisual",        en: "Video editing",      color: "#6366F1", concepts: ["EDICION", "VIDEO"] },
    ORGANIZACION:    { es: "Organización de conciertos / fiestas", en: "Concert / party org", color: "#ff9800", concepts: ["CONCIERTOS", "FIESTAS"] },
    ALQUILER_SONIDO: { es: "Alquiler de sonido e iluminación", en: "Sound / lighting rental", color: "#009688", concepts: ["ALQUILER", "SONIDO", "ILUMINACION"] },
    EVENTOS_CORP:    { es: "Eventos corporativos / sociales", en: "Corporate / social events", color: "#00bcd4", concepts: ["CORPORATIVO", "SOCIAL"] },
    COMISIONES:      { es: "Comisiones",                 en: "Commissions",        color: "#2980b9", concepts: ["COMISION", "BONO"] },
    REGALOS:         { es: "Regalos / apoyo familiar",  en: "Gifts / family support", color: "#e91e63", concepts: ["REGALOS", "APOYO"] },
    CRIPTO:          { es: "Cripto / trading",           en: "Crypto / trading",   color: "#ff9800", concepts: ["CRIPTO", "TRADING"] },
    DIVIDENDOS:      { es: "Dividendos",                 en: "Dividends",          color: "#4caf50", concepts: ["DIVIDENDOS", "ACCIONES"] },
    BONOS:           { es: "Bonos laborales",            en: "Work bonuses",       color: "#2196f3", concepts: ["BONO", "AGUINALDO"] },
    CASHBACK:        { es: "Cashback / recompensas",    en: "Cashback",           color: "#00bcd4", concepts: ["CASHBACK", "PUNTOS"] },
    AHORROS:         { es: "Ahorros_retirados",          en: "Savings withdrawn",  color: "#10B981", concepts: ["RETIRO", "AHORRO"] },
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
    MOTO:           { es: "Mantenimiento moto",  en: "Bike maintenance",color: "#38BDF8", concepts: ["MANTENIMIENTO", "MECANICO MOTO"] },
    REPUESTOS:      { es: "Repuestos",           en: "Parts",           color: "#c49a6c", concepts: ["REPUESTOS", "ACCESORIOS"] },
    LLANTAS:        { es: "Llantas",             en: "Tires",           color: "#6366F1", concepts: ["NEUMATICOS"] },
    ACEITE:         { es: "Cambio de aceite",    en: "Oil change",      color: "#d4af37", concepts: ["ACEITE", "LUBRICANTE"] },
    SOAT:           { es: "SOAT / Seguro",      en: "Insurance",      color: "#9b2335", concepts: ["SOAT", "SEGURO"] },
    ESTACIONAMIENTO:{ es: "Estacionamiento",    en: "Parking",        color: "#14B8A6", concepts: ["PARKING", "PLAYA"] },
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
    IMPUESTOS:      { es: "Impuestos",          en: "Taxes",          color: "#8B5CF6", concepts: ["IMPUESTOS", "COMISIONES"] },
    COMPRAS:        { es: "Compras varias",    en: "Misc shopping",  color: "#F59E0B", concepts: ["VARIOS", "OTROS"] },
  }
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

export function getToday() {
  return new Date();
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

