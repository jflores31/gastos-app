import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Grid, IconButton, LinearProgress, TextField, Typography } from "@mui/material";
import { Check as CheckIcon, Add as AddIcon, Edit as EditIcon } from "@/theme/icons";
import { toBase, fromBase } from "@/domain/money";
import { budgetFor } from "../domain/budgets";
import { CategoryAvatar } from "@/components/ui/GradientIcon";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { addBudgetCardSx, budgetBarSx, budgetCardSx, limitInputSx } from "./budgets.styles";

// "Presupuestos": one card per budgeted category (spent vs limit, limit editable inline)
// plus the "add budget" card. `cats` is txByCategory() of the period.
export function BudgetCardsGrid({ cats, period, onManage, showToast }) {
  const { t } = useSettings();
  const { editBudgets } = useData();

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.budgetTab.budgets}</Typography>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={onManage} size="small">
          {t.budgetTab.manage}
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {Object.keys(editBudgets).map((cat) => (
          <BudgetCard key={cat} cat={cat} spent={cats.find((c) => c.categoria === cat)?.total || 0} period={period} showToast={showToast} />
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card onClick={onManage} sx={addBudgetCardSx}>
            <Box sx={{ textAlign: "center", p: 2 }}>
              <AddIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{t.budgetTab.addBudget}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function BudgetCard({ cat, spent, period, showToast }) {
  const { t, lang, currency, fmt } = useSettings();
  const { editBudgets, budgetPeriods, setEditBudgets, customCats } = useData();
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const budgetPeriod = budgetPeriods[cat] ?? "month";
  const limit = budgetFor(editBudgets[cat], budgetPeriod, period);
  const pct = limit ? spent / limit : 0;
  const { label: catName, color, Icon } = resolveCategoryMeta(cat, customCats, lang, "EGRESO");
  const isOver = pct > 1;
  const isWarning = pct >= 0.8 && pct <= 1;

  const startEdit = () => { setEditing(true); setEditVal(String(fromBase(editBudgets[cat], currency))); };
  const saveEdit = async () => {
    const v = toBase(parseFloat(editVal), currency);
    if (!(v > 0)) { setEditing(false); return; }
    try {
      await setEditBudgets((b) => ({ ...b, [cat]: v }));
      showToast?.(t.budgetTab.budgetUpdated);
    } catch {
      showToast?.(t.budgetTab.errorUpdatingBudget, "error");
    } finally {
      setEditing(false);
    }
  };

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card sx={budgetCardSx({ color, isOver, isWarning })}>
        <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CategoryAvatar icon={Icon} color={color} size={36} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: isOver ? "error.dark" : isWarning ? "warning.dark" : "text.primary" }}>{catName}</Typography>
                {/* The budget's own amount and period when it isn't the one being viewed. */}
                {budgetPeriod !== period && (
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {fmt(editBudgets[cat], true)}{t.budgetTab.perPeriod(budgetPeriod)}
                  </Typography>
                )}
              </Box>
            </Box>
            {isWarning && !isOver && <Chip size="small" label="80%" color="warning" sx={{ height: 20, fontSize: 10 }} />}
            {isOver && <Chip size="small" label="!" color="error" sx={{ height: 20, fontWeight: 700 }} />}
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, pct * 100)}
            color={isOver ? "error" : isWarning ? "warning" : "primary"}
            sx={budgetBarSx}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} color={isOver ? "error.main" : "text.primary"}>{fmt(spent, true)}</Typography>
            {editing ? (
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <TextField size="small" type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} onBlur={saveEdit} sx={limitInputSx} autoFocus />
                <IconButton size="small" onClick={saveEdit} color="success" aria-label={t.common.save}><CheckIcon fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Chip size="small" variant="outlined" label={fmt(limit, true)} onClick={startEdit} sx={{ cursor: "pointer", fontWeight: 600 }} />
            )}
          </Box>
          <Box sx={{ p: 1, bgcolor: isOver ? "error.main" : isWarning ? "warning.main" : "action.hover", borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: isOver || isWarning ? "common.white" : "text.secondary", fontWeight: 500 }}>
              {isOver ? `+${fmt(spent - limit, true)} ${t.overspent.toLowerCase()}` : `${fmt(limit - spent, true)} ${t.remaining.toLowerCase()}`}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
