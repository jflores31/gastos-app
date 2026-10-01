import type { Account, Transaction, Transfer } from "@/types/domain";

// An account's balance today: the one typed in, as of `balanceAt`, plus what moved after
// that. Its income adds and its expenses subtract; transfers subtract from the origin and
// add to the destination. Movements dated up to `balanceAt` are already in the typed
// balance (so typing today's balance "resets" it).
export function accountBalance(account: Account, txs: Transaction[], transfers: Transfer[] = []) {
  const since = account.balanceAt?.getTime() ?? -Infinity;
  let b = account.balance;
  for (const t of txs) {
    if (t.cuentaId !== account.id || t.date.getTime() <= since) continue;
    b += t.tipo === "INGRESO" ? t.valor : -t.valor;
  }
  for (const tr of transfers) {
    if (tr.date.getTime() <= since) continue;
    if (tr.origen === account.id) b -= tr.monto;
    if (tr.destino === account.id) b += tr.monto;
  }
  return Math.round(b * 100) / 100;
}
