import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { TableSpec } from "@/types/database"

type Options<Item, Row> = TableSpec<Item, Row> & {
  supabase: SupabaseClient
  requireUserId: () => string
  setList: Dispatch<SetStateAction<Item[]>>
}

// Save (update when the item has an id, insert otherwise) and delete for a table whose rows
// map 1:1 to a list in state. Writes throw on error before touching state, so the callers'
// try/catch can show feedback. `optionalColumns` are dropped and the write retried once when
// PostgREST reports an unknown column (PGRST204), so saving works before a migration is run.
export function useTableCrud<Item extends { id?: string }, Row>({ supabase, requireUserId, table, setList, toRow, fromRow, optionalColumns }: Options<Item, Row>) {
  const save = useCallback(async (item: Item) => {
    const row = { user_id: requireUserId(), ...toRow(item) }
    const write = (r: Record<string, unknown>) => item.id
      ? supabase.from(table).update(r).eq("id", item.id).select().single()
      : supabase.from(table).insert(r).select().single()

    let { data, error } = await write(row)
    if (error?.code === "PGRST204" && optionalColumns?.some((c) => c in row)) {
      const reduced: Record<string, unknown> = { ...row }
      optionalColumns.forEach((c) => delete reduced[c])
      ;({ data, error } = await write(reduced))
    }
    if (error) throw error
    if (data) {
      const mapped = fromRow(data)
      setList((prev) => item.id ? prev.map((x) => x.id === item.id ? mapped : x) : [...prev, mapped])
    }
  }, [supabase, requireUserId, table, setList, toRow, fromRow, optionalColumns])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", requireUserId())
    if (error) throw error
    setList((prev) => prev.filter((x) => x.id !== id))
  }, [supabase, requireUserId, table, setList])

  return { save, remove }
}
