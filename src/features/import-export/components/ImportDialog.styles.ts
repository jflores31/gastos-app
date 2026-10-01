// Styles of the CSV import dialog.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** Preview of the rows to import: framed, and scrolls past 320 px. */
export const previewTableSx: SystemStyleObject<Theme> = { maxHeight: 320, border: 1, borderColor: "divider", borderRadius: 2, mt: 0.5 }
