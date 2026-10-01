import type { Goal } from "@/types/domain"
import type { GoalRow, TableSpec } from "@/types/database"

export function goalFromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    es: row.label_es,
    en: row.label_en,
    target: Number(row.target),
    current: Number(row.current_amount),
    deadline: row.deadline,
    color: row.color,
    icon: row.icon,
  }
}

// Row sent to Supabase (the inverse of goalFromRow); user_id is added by useTableCrud.
const goalToRow = (g: Goal) => ({
  label_es: g.es,
  label_en: g.en,
  target: g.target,
  current_amount: g.current,
  deadline: g.deadline || null,
  color: g.color,
  icon: g.icon,
})

export const goalsTable: TableSpec<Goal, GoalRow> = { table: "goals", fromRow: goalFromRow, toRow: goalToRow }
