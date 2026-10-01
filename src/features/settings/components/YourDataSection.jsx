import { useRef, useState } from "react";
import { Box, Button, ListItem, ListItemText } from "@mui/material";
import { TableChart as CsvIcon, DataObject as JsonIcon, UploadFile as ImportIcon, RestoreFromTrash as TrashIcon } from "@/theme/icons";
import { useSettings } from "@/contexts/SettingsContext";
import { useData } from "@/contexts/DataContext";
import { resolveCategoryMeta } from "@/theme/categoryIcons";
import { transactionsToCsv, backupToJson, exportFileName, downloadText } from "@/features/import-export/domain/export";
import { parseCsv, MAX_IMPORT_BYTES } from "@/features/import-export/domain/csvImport";
import { ImportDialog } from "@/features/import-export/components/ImportDialog";
import { TrashDialog } from "@/features/transactions/components/TrashDialog";

// "Tus datos": download the transactions as CSV or everything as a JSON backup, import
// transactions from a CSV (ImportDialog), and the trash of deleted transactions.
export function YourDataSection({ notify }) {
  const { t, lang } = useSettings();
  const data = useData();
  const fileInput = useRef(null);
  const [importTable, setImportTable] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // choosing the same file again fires onChange again
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) return notify(t.settingsPanel.importFileTooLarge, "error");
    const table = parseCsv(await file.text());
    if (!table.rows.length) return notify(t.settingsPanel.importEmpty, "error");
    setImportTable(table);
  };

  const exportCsv = () => {
    const name = (cat, tipo) => resolveCategoryMeta(cat, data.customCats, lang, tipo).label;
    const accountName = (id) => data.accounts.find((a) => a.id === id)?.name;
    downloadText(transactionsToCsv(data.txs, name, accountName), exportFileName(t.settingsPanel.exportCsvFile, "csv"), "text/csv;charset=utf-8");
    notify(t.settingsPanel.fileDownloaded, "success");
  };
  const exportJson = () => {
    downloadText(backupToJson(data), exportFileName(t.settingsPanel.exportJsonFile, "json"), "application/json");
    notify(t.settingsPanel.fileDownloaded, "success");
  };

  return (
    <>
      <ListItem sx={{ pt: 2 }}>
        <ListItemText
          primary={t.settingsPanel.yourData}
          secondary={t.settingsPanel.yourDataSubtitle}
          slotProps={{ primary: { variant: "overline" }, secondary: { variant: "caption" } }}
        />
      </ListItem>
      <ListItem sx={{ pt: 0, pb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
          <Button size="small" variant="outlined" startIcon={<CsvIcon />} onClick={exportCsv} disabled={data.loading} sx={{ borderRadius: 2, textTransform: "none" }}>
            {t.settingsPanel.exportCsv}
          </Button>
          <Button size="small" variant="outlined" startIcon={<JsonIcon />} onClick={exportJson} disabled={data.loading} sx={{ borderRadius: 2, textTransform: "none" }}>
            {t.settingsPanel.exportJson}
          </Button>
          <Button size="small" variant="outlined" startIcon={<ImportIcon />} onClick={() => fileInput.current?.click()} disabled={data.loading} sx={{ borderRadius: 2, textTransform: "none" }}>
            {t.settingsPanel.importCsv}
          </Button>
          <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={pickFile} aria-label={t.settingsPanel.importCsv} />
          <Button size="small" variant="outlined" color="inherit" startIcon={<TrashIcon />} onClick={() => setTrashOpen(true)} disabled={data.loading} sx={{ borderRadius: 2, textTransform: "none" }}>
            {t.settingsPanel.trash(data.trash.length)}
          </Button>
        </Box>
      </ListItem>
      {importTable && <ImportDialog table={importTable} notify={notify} onClose={() => setImportTable(null)} />}
      {trashOpen && <TrashDialog onClose={() => setTrashOpen(false)} />}
    </>
  );
}
