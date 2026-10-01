import { useMemo, useState } from "react";
import { filterByPeriod } from "@/domain/period";
import type { Period, Transaction, TxType } from "@/types/domain";
import { matchesCalendar } from "../domain/calendarFilter";
import type { CalendarSelection } from "../domain/calendarFilter";

// Filters of the Gastos and Ingresos lists. A day or month picked in the calendar replaces
// the period; the category chip applies on top of either. Newest first.
export function useTxFilters(txs: Transaction[], period: Period, tipo: TxType) {
  const [calFilter, setCalFilter] = useState<CalendarSelection | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const periodTxs = useMemo(() => filterByPeriod(txs, period), [txs, period]);
  const list = useMemo(() => {
    const base = calFilter
      ? txs.filter((x) => x.tipo === tipo && matchesCalendar(x, calFilter))
      : periodTxs.filter((x) => x.tipo === tipo);
    const byCategory = activeCat ? base.filter((x) => x.categoria === activeCat) : base;
    return byCategory.slice().reverse();
  }, [txs, periodTxs, tipo, calFilter, activeCat]);
  const total = useMemo(() => list.reduce((s, x) => s + x.valor, 0), [list]);

  return { periodTxs, calFilter, setCalFilter, activeCat, setActiveCat, list, total };
}
