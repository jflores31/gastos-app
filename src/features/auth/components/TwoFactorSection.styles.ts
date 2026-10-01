// Styles of the two-step verification section (Profile).
import type { Theme } from "@mui/material/styles"
import type { SystemStyleObject } from "@mui/system"

type Sx = SystemStyleObject<Theme>

/** The QR code: on white, so it scans in the dark theme too. */
export const qrImageSx: Sx = { width: 180, height: 180, alignSelf: "center", bgcolor: "common.white", p: 1, borderRadius: 2 }

/** The key to type in by hand. */
export const secretSx: Sx = { fontFamily: "monospace", wordBreak: "break-all", textAlign: "center", bgcolor: "action.hover", p: 1, borderRadius: 1 }
