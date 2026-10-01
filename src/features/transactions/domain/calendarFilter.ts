import type { Transaction } from "@/types/domain";

// What CalendarFilter selects: a day, or a month (date = its first day).
export type CalendarSelection = { type: "day" | "month"; date: Date };

// True when the transaction is on the selected day, or in the selected month.
export function matchesCalendar(tx: Pick<Transaction, "date">, selection: CalendarSelection): boolean {
  if (selection.type === "day") {
    const d = selection.date;
    return tx.date.getFullYear() === d.getFullYear() && tx.date.getMonth() === d.getMonth() && tx.date.getDate() === d.getDate();
  }
  return tx.date.getFullYear() === selection.date.getFullYear() && tx.date.getMonth() === selection.date.getMonth();
}
