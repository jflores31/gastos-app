import type { Period, Transaction } from "@/types/domain";

export function getToday() {
  return new Date();
}

export function filterByPeriod(txs: Transaction[], period: Period, offset = 0) {
  const today = getToday();
  if (period === "all") return txs;

  // start: first day at 00:00; end: last day at 23:59:59.999. (It used to end at 00:00 of
  // the last day, so that day's transactions fell out, and the week started Monday at
  // the current time of day.)
  let start: Date, end: Date;
  if (period === "week") {
    const dow = (today.getDay() + 6) % 7;
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow + offset * 7);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  } else if (period === "month") {
    const raw = today.getMonth() + offset;
    const y = today.getFullYear() + Math.floor(raw / 12);
    const mo = ((raw % 12) + 12) % 12;
    start = new Date(y, mo, 1);
    end = new Date(y, mo + 1, 0);
  } else if (period === "quarter") {
    const rawQ = Math.floor(today.getMonth() / 3) + offset;
    const y = today.getFullYear() + Math.floor(rawQ / 4);
    const q = ((rawQ % 4) + 4) % 4;
    start = new Date(y, q * 3, 1);
    end = new Date(y, q * 3 + 3, 0);
  } else if (period === "year") {
    start = new Date(today.getFullYear() + offset, 0, 1);
    end = new Date(today.getFullYear() + offset, 11, 31);
  } else {
    return []; // unknown period (JS callers aren't type-checked)
  }
  end.setHours(23, 59, 59, 999);

  return txs.filter((t) => t.date >= start && t.date <= end);
}

export function periodLabel(period: Period, t: Record<"week" | "month" | "quarter" | "year" | "all", string>) {
  if (period === "week") return t.week;
  if (period === "month") return t.month;
  if (period === "quarter") return t.quarter;
  if (period === "year") return t.year;
  return t.all;
}

export function monthCount(period: Period) {
  if (period === "year") return 12;
  if (period === "quarter") return 3;
  if (period === "month") return 1;
  if (period === "week") return 0.25;
  return 1;
}

export function daysCount(period: Period) {
  if (period === "year") return 365;
  if (period === "quarter") return 90;
  if (period === "month") return 30;
  if (period === "week") return 7;
  return 30;
}
