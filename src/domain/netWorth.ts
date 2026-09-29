import type { Account, Debt, Investment } from "@/types/domain";

// Net worth for the Goals tab. Assets: positive account balances plus the value of every
// investment. Debt: negative account balances (e.g. a used credit card) plus the
// outstanding balance of every loan.
export function netWorthOf(accounts: Account[] = [], debts: Debt[] = [], investments: Investment[] = []) {
  const balances = accounts.map((a) => a.current ?? a.balance);
  const assets = balances.filter((b) => b > 0).reduce((s, b) => s + b, 0)
    + investments.reduce((s, i) => s + (i.value || 0), 0);
  const debt = Math.abs(balances.filter((b) => b < 0).reduce((s, b) => s + b, 0))
    + debts.reduce((s, d) => s + (d.balance || 0), 0);
  return { assets, debt, net: assets - debt };
}
