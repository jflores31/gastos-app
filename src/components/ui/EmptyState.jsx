import { Box, Typography } from "@mui/material";
import { Inbox as InboxIcon } from "@/theme/icons";
import { GradientIcon } from "./GradientIcon";

// Empty list or section: an icon in a neutral bubble, a title and optional text and action.
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, px: 3, textAlign: "center" }}>
      {/* Neutral bubble instead of a grey.100 Avatar, which stood out as a light disc in dark mode. */}
      <Box sx={{ mb: 2 }}>
        <GradientIcon tone="neutral" bubble bubbleSize={64} size={32}>
          {icon || <InboxIcon />}
        </GradientIcon>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }} color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>
          {subtitle}
        </Typography>
      )}
      {action}
    </Box>
  );
}
