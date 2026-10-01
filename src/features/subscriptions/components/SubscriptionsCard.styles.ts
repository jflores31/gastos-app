// Styles of the subscriptions card.
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

/** The subscription's initial when it has no category icon. */
export const initialBadgeSx: SystemStyleObject<Theme> = {
  width: 40, height: 40, borderRadius: 2, flexShrink: 0, bgcolor: "secondary.light", color: "secondary.dark",
  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
}
