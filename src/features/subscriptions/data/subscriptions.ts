import type { Subscription } from "@/types/domain"
import type { SubscriptionRow, TableSpec } from "@/types/database"

export function subscriptionFromRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    cycle: row.cycle,
    category: row.category,
  }
}

// Row sent to Supabase (the inverse of subscriptionFromRow); user_id is added by useTableCrud.
const subscriptionToRow = (sub: Subscription) => ({
  name: sub.name,
  price: sub.price,
  cycle: sub.cycle,
  category: sub.category,
})

export const subscriptionsTable: TableSpec<Subscription, SubscriptionRow> = { table: "subscriptions", fromRow: subscriptionFromRow, toRow: subscriptionToRow }
