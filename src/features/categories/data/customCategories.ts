import type { CustomCategory } from "@/types/domain"
import type { CustomCategoryRow, TableSpec } from "@/types/database"

const customCatToRow = (c: CustomCategory) => ({ nombre: c.nombre, tipo: c.tipo, color: c.color, icon: c.icon ?? null })
const keepRow = (row: CustomCategoryRow): CustomCategory => row // custom categories are kept as raw rows

// custom_categories.icon is missing in a DB created before 0.0.1 that hasn't run
// supabase/schema.sql yet.
const CUSTOM_CAT_OPTIONAL_COLUMNS = ["icon"]

export const customCategoriesTable: TableSpec<CustomCategory, CustomCategoryRow> = {
  table: "custom_categories", fromRow: keepRow, toRow: customCatToRow, optionalColumns: CUSTOM_CAT_OPTIONAL_COLUMNS,
}
