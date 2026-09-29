import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { CATEGORIES } from "@/domain/categories/catalog";
import { CURRENCIES, currencyOf } from "@/domain/money";
import { buildImport, detectAppFormat, guessColumns, MAX_IMPORT_ROWS } from "../../data/import";

const PREVIEW_ROWS = 50;
const REQUIRED = ["fecha", "concepto", "monto"];
const OPTIONAL = ["tipo", "categoria"];

// Two steps: map the file's columns (skipped for the app's own export), then a preview
// with counts, duplicates and errors before saving everything with addTxs().
export function ImportDialog({ table, onClose, notify }) {
  const { t, lang, currency, fmtTx } = useSettings();
  const { txs, customCats, accounts, addTxs } = useData();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const appMap = useMemo(() => detectAppFormat(table.header), [table]);

  const [map, setMap] = useState(() => appMap ?? { fecha: -1, concepto: -1, monto: -1, tipo: -1, categoria: -1, ...guessColumns(table.header) });
  const [step, setStep] = useState(appMap ? "preview" : "map");
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  // A generic file's amounts are all in one currency, the display one unless changed.
  const [fileCurrency, setFileCurrency] = useState(() => currencyOf(currency).code);
  const [defaults, setDefaults] = useState({ EGRESO: "COMPRAS", INGRESO: Object.keys(CATEGORIES.income)[0] });
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    if (step !== "preview") return null;
    const clean = Object.fromEntries(Object.entries(map).filter(([, v]) => v >= 0));
    return buildImport(table, clean, {
      txs, currency: fileCurrency, amountsInBase: !!appMap, accounts,
      customCategoryIds: customCats.map((c) => `custom_${c.id}`),
    });
  }, [step, map, table, txs, fileCurrency, appMap, customCats, accounts]);

  const rows = result?.rows ?? [];
  const duplicates = rows.filter((r) => r.duplicate).length;
  const toSave = rows
    .filter((r) => includeDuplicates || !r.duplicate)
    .map((r) => ({ ...r, categoria: r.categoria ?? defaults[r.tipo] }));
  const needsDefault = ["EGRESO", "INGRESO"].filter((tipo) => rows.some((r) => !r.categoria && r.tipo === tipo));

  const columnLabel = { fecha: t.settingsPanel.columnDate, concepto: t.settingsPanel.columnConcept, monto: t.settingsPanel.columnAmount, tipo: t.settingsPanel.columnType, categoria: t.settingsPanel.columnCategory };
  const categoryChoices = (tipo) => [
    ...Object.keys(tipo === "INGRESO" ? CATEGORIES.income : CATEGORIES.expense),
    ...customCats.filter((c) => c.tipo === tipo).map((c) => `custom_${c.id}`),
  ];
  const catLabel = (cat, tipo) => resolveCategoryMeta(cat, customCats, lang, tipo).label;

  const handleImport = async () => {
    setSaving(true);
    try {
      const saved = await addTxs(toSave);
      notify(t.settingsPanel.importDone(saved), "success");
      onClose();
    } catch (e) {
      notify(e?.saved != null && e.saved > 0 ? t.settingsPanel.importPartial(e.saved, toSave.length) : t.txModal.errorSavingPleaseTryAgain, "error");
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={fullScreen} slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t.settingsPanel.importTitle}</DialogTitle>

      {step === "map" ? (
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&&": { pt: 1 } }}>
          <Typography variant="body2" color="text.secondary">{t.settingsPanel.importMapHint}</Typography>
          {[...REQUIRED, ...OPTIONAL].map((key) => (
            <FormControl key={key} fullWidth size="small">
              <InputLabel id={`import-col-${key}`}>{columnLabel[key]}</InputLabel>
              <Select labelId={`import-col-${key}`} label={columnLabel[key]} value={map[key] ?? -1}
                onChange={(e) => setMap((m) => ({ ...m, [key]: Number(e.target.value) }))}>
                {OPTIONAL.includes(key) && <MenuItem value={-1}>{t.settingsPanel.noColumn}</MenuItem>}
                {table.header.map((h, i) => (
                  <MenuItem key={i} value={i}>{h || t.settingsPanel.columnN(i + 1)}{table.rows[0]?.[i] ? ` · ${table.rows[0][i].slice(0, 30)}` : ""}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <FormControl fullWidth size="small">
            <InputLabel id="import-currency">{t.settingsPanel.fileCurrency}</InputLabel>
            <Select labelId="import-currency" label={t.settingsPanel.fileCurrency} value={fileCurrency} onChange={(e) => setFileCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([k, c]) => <MenuItem key={k} value={k}>{c.symbol} {k} · {c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Alert severity="info" variant="outlined">
            {t.settingsPanel.importAmountsIn(fileCurrency)} {t.settingsPanel.importSignHint}
          </Alert>
        </DialogContent>
      ) : (
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, "&&": { pt: 1 } }}>
          <Alert severity="info" variant="outlined">
            {appMap ? t.settingsPanel.importAppFormat : `${t.settingsPanel.importAmountsIn(fileCurrency)}${map.tipo >= 0 ? "" : ` ${t.settingsPanel.importSignHint}`}`}
          </Alert>
          {result.truncated && <Alert severity="warning">{t.settingsPanel.importTruncated(MAX_IMPORT_ROWS)}</Alert>}

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip color="success" label={t.settingsPanel.importNew(rows.length - duplicates)} />
            {duplicates > 0 && <Chip label={t.settingsPanel.importDuplicates(duplicates)} />}
            {result.invalid.length > 0 && <Chip color="error" variant="outlined" label={t.settingsPanel.importInvalid(result.invalid.length)} />}
          </Stack>

          {duplicates > 0 && (
            <FormControlLabel control={<Checkbox checked={includeDuplicates} onChange={(e) => setIncludeDuplicates(e.target.checked)} />} label={t.settingsPanel.includeDuplicates} />
          )}

          {needsDefault.map((tipo) => (
            <FormControl key={tipo} fullWidth size="small">
              <InputLabel id={`import-default-${tipo}`}>{t.settingsPanel.defaultCategoryFor(tipo)}</InputLabel>
              <Select labelId={`import-default-${tipo}`} label={t.settingsPanel.defaultCategoryFor(tipo)} value={defaults[tipo]}
                onChange={(e) => setDefaults((d) => ({ ...d, [tipo]: e.target.value }))}>
                {categoryChoices(tipo).map((cat) => <MenuItem key={cat} value={cat}>{catLabel(cat, tipo)}</MenuItem>)}
              </Select>
            </FormControl>
          ))}

          {result.invalid.length > 0 && (
            <Alert severity="error" variant="outlined">
              {result.invalid.slice(0, 5).map((r) => <div key={r.line}>{t.settingsPanel.importInvalidLine(r.line, r.reason)}</div>)}
              {result.invalid.length > 5 && <div>…</div>}
            </Alert>
          )}

          {rows.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">{t.settingsPanel.importFirstRows(Math.min(PREVIEW_ROWS, rows.length), rows.length)}</Typography>
              <TableContainer sx={{ maxHeight: 320, border: 1, borderColor: "divider", borderRadius: 2, mt: 0.5 }}>
                <Table size="small" stickyHeader aria-label={t.settingsPanel.importTitle}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.concept}</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{t.category}</TableCell>
                      <TableCell align="right">{t.amount}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.slice(0, PREVIEW_ROWS).map((r) => (
                      <TableRow key={r.line} sx={{ opacity: r.duplicate && !includeDuplicates ? 0.45 : 1 }}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{r.date.toLocaleDateString(t.common.locale)}</TableCell>
                        <TableCell>
                          {r.concepto}
                          {r.duplicate && <Chip size="small" label={t.settingsPanel.alreadyRegistered} sx={{ ml: 1 }} />}
                          {/* On phones the category goes under the concept instead of its own column. */}
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>
                            {catLabel(r.categoria ?? defaults[r.tipo], r.tipo)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{catLabel(r.categoria ?? defaults[r.tipo], r.tipo)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 600, color: r.tipo === "INGRESO" ? "success.main" : "error.main" }}>
                          {r.tipo === "INGRESO" ? "+" : "−"}{fmtTx(r)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === "preview" && !appMap && <Button onClick={() => setStep("map")} disabled={saving} sx={{ mr: "auto" }}>{t.settingsPanel.back}</Button>}
        <Button onClick={onClose} color="inherit" disabled={saving}>{t.cancel}</Button>
        {step === "map" ? (
          <Button variant="contained" onClick={() => setStep("preview")} disabled={REQUIRED.some((k) => !(map[k] >= 0))}>{t.settingsPanel.next}</Button>
        ) : (
          <Button variant="contained" onClick={handleImport} disabled={saving || toSave.length === 0}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t.settingsPanel.importButton(toSave.length)}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
