import { CATEGORIES } from "./catalog"
import type { Transaction, TxType } from "@/types/domain"

// Category suggestion for the concept typed in the transaction form.
// 1. History: the category the user picked most often for the same concept (ties go to
//    the most recent). Custom categories count too.
// 2. Catalog: a built-in category whose key or listed concepts appear as whole words in
//    the text ("PAGO NETFLIX" → STREAMING). The category matching the most words wins
//    ("COMIDA A DOMICILIO" is DELIVERY, not COMIDA); a tie suggests nothing
//    ("MANTENIMIENTO" alone is both AUTO and MOTO).
// `tipo` limits the suggestion to income or expense categories (the form's toggle).

export type Suggestion = { categoria: string; tipo: TxType; source: "history" | "catalog" }

// "  Café  del día " → "CAFE DEL DIA": case, accents and spacing don't matter.
export const normalizeConcept = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/\s+/g, " ").trim()

const hasWords = (text: string, words: string) => ` ${text} `.includes(` ${words} `)

export function suggestCategory(concepto: string, txs: Transaction[], tipo?: TxType): Suggestion | null {
  const key = normalizeConcept(concepto)
  if (key.length < 2) return null

  const seen = new Map<string, { tipo: TxType; count: number; last: number }>()
  for (const tx of txs) {
    if ((tipo && tx.tipo !== tipo) || normalizeConcept(tx.concepto) !== key) continue
    const e = seen.get(tx.categoria) ?? { tipo: tx.tipo, count: 0, last: 0 }
    e.count++
    e.last = Math.max(e.last, tx.date.getTime())
    seen.set(tx.categoria, e)
  }
  if (seen.size) {
    const [categoria, e] = [...seen].sort(([, a], [, b]) => b.count - a.count || b.last - a.last)[0]
    return { categoria, tipo: e.tipo, source: "history" }
  }

  const groups: [TxType, typeof CATEGORIES.income][] = [["INGRESO", CATEGORIES.income], ["EGRESO", CATEGORIES.expense]]
  let best: { categoria: string; tipo: TxType }[] = []
  let bestScore = 0
  for (const [groupTipo, group] of groups) {
    if (tipo && groupTipo !== tipo) continue
    for (const [categoria, def] of Object.entries(group)) {
      const terms = new Set([categoria.replace(/_/g, " "), ...def.concepts].map(normalizeConcept))
      let score = 0
      for (const term of terms) if (hasWords(key, term)) score += term.split(" ").length
      if (score === 0 || score < bestScore) continue
      if (score > bestScore) { best = []; bestScore = score }
      best.push({ categoria, tipo: groupTipo })
    }
  }
  return best.length === 1 ? { ...best[0], source: "catalog" } : null
}
