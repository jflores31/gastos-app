import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, IconButton } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@/theme/icons";
import { CategoryAvatar } from "@/components/ui/GradientIcon";
import type { CategoryMeta } from "@/theme/categoryIcons";
import type { Transaction } from "@/types/domain";
import { useSettings } from "@/contexts/SettingsContext";
import { useTxExtras } from "../hooks/useTxExtras";
import { NoTransactions } from "./NoTransactions";

// The transactions list of Gastos and Ingresos: category, concept, date and extras,
// the amount (beside the row on desktop, under the concept on mobile), edit and delete.
// `type` ("expense" | "income") sets the amount's color and sign and the empty state.
export function TransactionList({ type, txs, catMeta, onEdit, onDelete }: {
  type: "expense" | "income";
  txs: Transaction[];
  catMeta: (categoria: string) => CategoryMeta;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const { t, fmtTx } = useSettings();
  const txExtras = useTxExtras();
  const amountColor = type === "expense" ? "error.main" : "success.main";
  const sign = type === "expense" ? "−" : "+";

  if (txs.length === 0) return <NoTransactions type={type} />;
  return (
    <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
      {txs.map((x) => {
        const { label: catName, color, Icon } = catMeta(x.categoria);
        return (
          <ListItem key={x.id} disablePadding sx={{ py: 1, borderBottom: 1, borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
            secondaryAction={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body1" color={amountColor} sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}>
                  {sign}{fmtTx(x, true)}
                </Typography>
                <IconButton onClick={() => onEdit(x)} aria-label={t.common.edit} sx={{ minWidth: 40, minHeight: 40 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(x)} aria-label={t.common.delete} sx={{ minWidth: 40, minHeight: 40 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemAvatar sx={{ minWidth: 52 }}>
              <CategoryAvatar icon={Icon} color={color} />
            </ListItemAvatar>
            <ListItemText
              primary={<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{x.concepto}</Typography>}
              secondary={
                <Typography variant="caption" color="text.secondary" component="span">
                  {catName} · {x.date.toLocaleString(t.common.locale, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                  {txExtras(x)}
                  <Typography variant="caption" color={amountColor} sx={{ fontWeight: 700, display: { xs: "inline", sm: "none" }, ml: 1 }}>
                    {sign}{fmtTx(x, true)}
                  </Typography>
                </Typography>
              }
              sx={{ mr: { xs: 12, sm: 18 } }}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
