import { messagesFor } from "@/i18n/index";

export function healthScore(savingsRate: number, spendingChange: number, anomalyCount: number) {
  let score = 50;
  // Savings: up to +40, reaching the cap at a 20% savings rate.
  score += Math.min(40, savingsRate * 2);
  // Spending trend vs previous period: flat bonus if down, graduated penalty if up.
  if (spendingChange < 0) score += 10;
  else score -= Math.min(15, spendingChange * 0.3);
  // Unusual expenses flagged by flagAnomalies().
  score -= anomalyCount * 5;
  // Max reachable = 50 + 40 + 10 = 100.
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Label/colour for a health score. Single source of truth shared by the tabs;
// thresholds match (>=75 good, >=50 fair, else critical).
export function healthLabel(score: number, lang: string) {
  const m = messagesFor(lang).healthLevels;
  if (score >= 75) return m.excellent;
  if (score >= 50) return m.fair;
  return m.critical;
}

export function healthTone(score: number) {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "error";
}
