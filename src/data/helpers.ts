import { messagesFor } from "../i18n/index";
import { daysCount } from "@/domain/period";
import type { Period } from "@/types/domain";

export type Insight = { icon: "trend" | "savings" | "warning" | "forecast"; tone: "good" | "warn" | "info"; title: string; desc: string };

export function insightsList(
  lang: string, totalOut: number, _totalIn: number, savingsRate: number, dOut: number,
  anomalies: unknown[], currency: string,
  fmtMoney: (v: number, currency: string, compact: boolean) => string,
  period: Period = "month",
): Insight[] {
  const m = messagesFor(lang).insightTexts;
  const t: Insight[] = [];
  t.push({
    icon: "trend", tone: dOut > 0 ? "warn" : "good",
    title: m.spendingTrend,
    desc: m.spendingTrendDesc(Math.abs(dOut).toFixed(0), dOut > 0),
  });
  t.push({
    icon: "savings", tone: savingsRate >= 20 ? "good" : savingsRate >= 10 ? "info" : "warn",
    title: m.savingsRate,
    desc: m.savingsRateDesc(savingsRate.toFixed(0), savingsRate >= 20),
  });
  if (anomalies.length > 0) {
    t.push({
      icon: "warning", tone: "warn",
      title: m.unusualExpenses,
      desc: m.unusualExpensesDesc(anomalies.length),
    });
  }
  t.push({
    icon: "forecast", tone: "info",
    title: m.monthEndForecast,
    desc: m.monthEndForecastDesc(fmtMoney((totalOut / daysCount(period)) * 30, currency, true)),
  });
  return t;
}
