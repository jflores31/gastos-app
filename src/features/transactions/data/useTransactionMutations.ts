import { useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Transaction } from "@/types/domain"
import { transactionFromRow, transactionToRow, IMPORT_CHUNK } from "./transactions"
import type { TxInput } from "./transactions"

type Options = {
  supabase: SupabaseClient
  requireUserId: () => string
  setTxs: Dispatch<SetStateAction<Transaction[]>>
  setTrash: Dispatch<SetStateAction<Transaction[]>>
}

// Writes of DataContext's transactions and trash. Each one throws on error before touching
// state; `txs` is kept sorted by date after every write.
export function useTransactionMutations({ supabase, requireUserId, setTxs, setTrash }: Options) {
  const addTx = useCallback(async (tx: TxInput) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: requireUserId(),
        ...transactionToRow(tx),
      })
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => [...prev, transactionFromRow(data)].sort((a, b) => +a.date - +b.date))
  }, [supabase, requireUserId, setTxs])

  // Bulk insert (CSV import) in chunks of IMPORT_CHUNK rows, one request each. Each
  // chunk is all or nothing; if one fails, the error carries how many rows were
  // already saved (`error.saved`) and those stay in state.
  const addTxs = useCallback(async (list: TxInput[]) => {
    const userId = requireUserId()
    let saved = 0
    for (let i = 0; i < list.length; i += IMPORT_CHUNK) {
      const rows = list.slice(i, i + IMPORT_CHUNK).map((tx) => ({
        user_id: userId,
        ...transactionToRow(tx),
      }))
      const { data, error } = await supabase.from("transactions").insert(rows).select()
      if (error) throw Object.assign(new Error(error.message), { saved })
      saved += data?.length ?? 0
      if (data?.length) setTxs((prev) => [...prev, ...data.map(transactionFromRow)].sort((a, b) => +a.date - +b.date))
    }
    return saved
  }, [supabase, requireUserId, setTxs])

  const updateTx = useCallback(async (tx: TxInput & { id: string }) => {
    const { data, error } = await supabase
      .from("transactions")
      .update(transactionToRow(tx))
      .eq("id", tx.id)
      .eq("user_id", requireUserId())
      .select()
      .single()

    if (error) throw error
    if (data) setTxs((prev) => prev.map((x) => x.id === tx.id ? transactionFromRow(data) : x).sort((a, b) => +a.date - +b.date))
  }, [supabase, requireUserId, setTxs])

  // Deleting moves the transaction to the trash (deleted_at); restoreTx() brings it back.
  const deleteTx = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", requireUserId())
      .select()
      .single()
    if (error) throw error
    setTxs((prev) => prev.filter((x) => x.id !== id))
    if (data) setTrash((prev) => [transactionFromRow(data), ...prev.filter((x) => x.id !== id)])
  }, [supabase, requireUserId, setTxs, setTrash])

  const restoreTx = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", requireUserId())
      .select()
      .single()
    if (error) throw error
    setTrash((prev) => prev.filter((x) => x.id !== id))
    if (data) setTxs((prev) => [...prev.filter((x) => x.id !== id), transactionFromRow(data)].sort((a, b) => +a.date - +b.date))
  }, [supabase, requireUserId, setTxs, setTrash])

  // Permanent delete, only from the trash.
  const purgeTx = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", requireUserId()).not("deleted_at", "is", null)
    if (error) throw error
    setTrash((prev) => prev.filter((x) => x.id !== id))
  }, [supabase, requireUserId, setTrash])

  const emptyTrash = useCallback(async () => {
    const { error } = await supabase.from("transactions").delete().eq("user_id", requireUserId()).not("deleted_at", "is", null)
    if (error) throw error
    setTrash([])
  }, [supabase, requireUserId, setTrash])

  return { addTx, addTxs, updateTx, deleteTx, restoreTx, purgeTx, emptyTrash }
}
