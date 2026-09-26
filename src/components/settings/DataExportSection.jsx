import { Box, Button, ListItem, ListItemText } from "@mui/material";
import { TableChart as CsvIcon, DataObject as JsonIcon } from "../../theme/icons";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext.jsx";
import { resolveCategoryMeta } from "../../theme/categoryIcons.js";
import { transactionsToCsv, backupToJson, exportFileName, downloadText } from "../../data/export";

// "Tus datos": download the transactions as CSV or everything as a JSON backup.
export function DataExportSection({ notify }) {
  const { t, lang } = useSettings();
  const data = useData();

  const exportCsv = () => {
    const name = (cat, tipo) => resolveCategoryMeta(cat, data.customCats, lang, tipo).label;
    downloadText(transactionsToCsv(data.txs, name), exportFileName(t.settingsPanel.exportCsvFile, "csv"), "text/csv;charset=utf-8");
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
          primaryTypographyProps={{ variant: "overline" }}
          secondaryTypographyProps={{ variant: "caption" }}
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
        </Box>
      </ListItem>
    </>
  );
}
