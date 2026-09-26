import { Box, Button, Card, CardContent, Grid, LinearProgress, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import en from "dayjs/locale/en";
import { Add as AddIcon, Savings as GoalIcon } from "../../theme/icons";
import { toBase, fromBase } from "../../data/index.js";
import { GradientIcon, CategoryAvatar } from "../../theme/GradientIcon.jsx";
import { IconPicker } from "../../theme/IconPicker.jsx";
import { iconByName } from "../../theme/categoryIcons.js";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useEntityDialog } from "./useEntityDialog.js";
import { EntityDialog } from "./EntityDialog.jsx";
import { EmptySection } from "./EmptySection.jsx";

const DAYJS_LOCALES = { es, en };
const EMPTY_GOAL = { es: "", en: "", target: "", current: "", deadline: null, color: "#7ab87a", icon: "Flag" };

export function GoalsSection({ showToast }) {
  const { t, lang, currency } = useSettings();
  const { goals, saveGoal, deleteGoal } = useData();
  const dialog = useEntityDialog({
    empty: EMPTY_GOAL,
    toForm: (g) => ({ ...g, target: String(fromBase(g.target, currency)), current: String(fromBase(g.current, currency)) }),
    save: saveGoal,
    remove: deleteGoal,
    showToast,
    messages: t.goalsTab.goalToasts,
  });
  const { form, update } = dialog;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", borderTop: "4px solid", borderTopColor: "success.main" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GradientIcon icon={GoalIcon} tone="income" bubble bubbleSize={40} size={22} />
            <Box>
              <Typography variant="h6" fontWeight={700}>{t.goals} · {t.goalsTab.savings}</Typography>
              <Typography variant="caption" color="text.secondary">{goals.length} {t.goalsTab.activeGoals}</Typography>
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={dialog.openNew}>
            {t.goalsTab.newGoal}
          </Button>
        </Box>
        {goals.length === 0 ? (
          <EmptySection label={t.goalsTab.noSavingsGoalsYet} onAdd={dialog.openNew} />
        ) : (
          <Grid container spacing={3}>
            {goals.map((g) => <GoalCard key={g.id} goal={g} onOpen={() => dialog.openEdit(g)} />)}
          </Grid>
        )}
      </CardContent>

      <EntityDialog
        dialog={dialog}
        title={dialog.editing ? (t.goalsTab.editGoal) : (t.goalsTab.newGoal)}
        canSave={form.es && form.target}
        onSave={() => dialog.submit({ ...form, target: toBase(parseFloat(form.target), currency), current: toBase(parseFloat(form.current) || 0, currency) })}
      >
        <TextField label={t.common.name} value={form.es} inputProps={{ maxLength: 60 }} onChange={(e) => update({ es: e.target.value, en: e.target.value })} fullWidth />
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.target} type="number" inputMode="decimal" inputProps={{ min: 0 }} value={form.target} onChange={(e) => update({ target: e.target.value })} fullWidth />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label={t.goalsTab.current} type="number" inputMode="decimal" inputProps={{ min: 0 }} value={form.current} onChange={(e) => update({ current: e.target.value })} fullWidth />
          </Grid>
        </Grid>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={DAYJS_LOCALES[lang]}>
          <DatePicker label={t.goalsTab.deadline} value={form.deadline ? dayjs(form.deadline) : null} onChange={(v) => update({ deadline: v ? v.format("YYYY-MM-DD") : null })} minDate={dayjs()} slotProps={{ textField: { fullWidth: true } }} format={t.goalsTab.dateFormat} />
        </LocalizationProvider>
        <TextField label="Color" type="color" value={form.color} onChange={(e) => update({ color: e.target.value })} sx={{ width: 80 }} />
        <IconPicker label={t.common.icon} value={form.icon} color={form.color} onChange={(icon) => update({ icon })} />
      </EntityDialog>
    </Card>
  );
}

function GoalCard({ goal: g, onOpen }) {
  const { t, lang, fmt } = useSettings();
  const pct = g.target > 0 ? g.current / g.target : 0;
  const left = Math.max(0, g.target - g.current);
  const days = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline) - new Date()) / 86400000)) : null;
  const GoalGlyph = iconByName(g.icon);
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card variant="outlined" sx={{ borderRadius: 2, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s", "&:hover": { boxShadow: 2, transform: "translateY(-2px)" }, minHeight: 160, display: "flex", flexDirection: "column" }} onClick={onOpen}>
        <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", "&:last-child": { pb: 2.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            {GoalGlyph ? (
              <CategoryAvatar icon={GoalGlyph} color={g.color} size={44} />
            ) : (
              // Older goals stored a free-text glyph (e.g. "◉").
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${g.color}20`, color: g.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{g.icon}</Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={600} noWrap>{g[lang]}</Typography>
              {days !== null && <Typography variant="caption" color="text.secondary">{days} {t.goalsTab.days}</Typography>}
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: g.color }}>{Math.round(pct * 100)}%</Typography>
              <Typography variant="body2" fontWeight={600} color={pct >= 1 ? "success.main" : "text.secondary"}>
                {pct >= 1
                  ? (t.goalsTab.goalReached)
                  : `${fmt(left, true)} ${t.goalsTab.toGo}`}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(100, pct * 100)} sx={{ height: 8, borderRadius: 4, mb: 1.5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 4 } }} />
            <Typography variant="caption" color="text.secondary">
              <strong>{fmt(g.current, true)}</strong> / {fmt(g.target, true)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
