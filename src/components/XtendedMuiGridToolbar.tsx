import * as React from "react";
import { Toolbar, ToolbarButton } from "@mui/x-data-grid";
import {
  Box,
  Menu,
  MenuItem,
  Select,
  TextField,
  IconButton,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Tooltip,
  Popper,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Check, Close } from "@mui/icons-material";
import { FETCH_MODE } from "./types.js";
// import axios from "axios";

import { XtendedMuiGridToolbarProps } from "./types.js";

// export const request = {
//   post: async ({ url, data, method = "POST" }: any): Promise<any> => {
//     try {
//       const response = await axios({
//         method,
//         url: url,
//         data,
//       });

//       return response.data;
//     } catch (err: any) {
//       const data = err.response.data;
//       console.error(data);
//     }
//   },
//   get: async ({ url, method = "GET" }: { url: string; method?: string }) => {
//     try {
//       const response = await axios({
//         url: url,
//         method,
//         // data,
//       });

//       return response.data;
//     } catch (error) {
//       throw error;
//     }
//   },
// };

const operators = ["equals", "contains", ">", "<"];

const XtendedMuiGridToolbar: React.FC<XtendedMuiGridToolbarProps> = ({
  columns,
  filterMap,
  csvExportUrl,
  excelExportUrl,
  exportFileName,
  handleExport,
  externalLoading,
  filterModel,
  setFilterModel,
  emitOnFilterModelChange,
  retrievePayload,
  fetchMode,
}) => {
  const [newPanelOpen, setNewPanelOpen] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [localFilterModel, setLocalFilterModel] = React.useState(filterModel);

  const newPanelTriggerRef = React.useRef<HTMLButtonElement>(null);
  const exportTriggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (newPanelOpen) {
      setLocalFilterModel(filterModel);
    }
  }, [newPanelOpen, filterModel]);

  const handleClose = () => {
    setNewPanelOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
    if (event.key === "Enter" && newPanelOpen) {
      handleSendFilter();
    }
  };

  const handleSendFilter = () => {
    emitOnFilterModelChange(localFilterModel);
    setNewPanelOpen(false);
  };

  const addFilter = () => {
    setLocalFilterModel((prev: any) => {
      const newFilter = {
        field: columns.length > 0 ? columns[0].field : "",
        operator: "contains",
        value: "",
      };
      return {
        ...prev,
        items: [...(prev.items || []), newFilter],
      };
    });
  };

  const updateFilter = (index: number, key: string, value: any) => {
    setLocalFilterModel((prev: any) => {
      const items = [...(prev.items || [])];
      if (!items[index]) {
        items[index] = { field: "", operator: "contains", value: "" };
      }
      (items[index] as any)[key] = value;
      return { ...prev, items };
    });
  };

  const updateLinkingOperator = (e: any) => {
    if (!e.target || !e.target.value) return;
    const newOperator = e.target.value.toLowerCase();
    setLocalFilterModel((prev: any) => ({
      ...prev,
      logicOperator: newOperator,
    }));
  };

  const removeFilter = (index: number) => {
    setFilterModel((prev: any) => {
      const items = (prev.items || []).filter(
        (item: any, i: number) => item && i !== index
      );
      return { ...prev, items };
    });
    setLocalFilterModel((prev: any) => {
      const items = (prev.items || []).filter(
        (item: any, i: number) => item && i !== index
      );
      return { ...prev, items };
    });
  };

  const exportMenuClick = async (fileType: "csv" | "excel") => {
    if (!handleExport && !excelExportUrl && !csvExportUrl) {
      console.error("No 'Export' handler specified.");
      return;
    } else if ((!handleExport && excelExportUrl) || csvExportUrl) {
      const exportLink = fileType === "csv" ? csvExportUrl : excelExportUrl;
      if (!exportLink) {
        console.error("Export URL is not defined");
        return;
      }
      const reqPayload = retrievePayload();
      let url = exportLink;
      if (fetchMode === FETCH_MODE.GET) {
        url += `?${reqPayload.toString()}`;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Export failed with status: ${response.status}`);
        }
        const blob = await response.blob();

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const ext = fileType === "csv" ? "csv" : "xlsx";
        link.download = `${exportFileName || "my-data"}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up the object URL
      } catch (error) {
        console.error("Error during export:", error);
      }
    } else if ((handleExport && excelExportUrl) || csvExportUrl) {
      console.error(
        "Can not set both 'handleExport' and 'exportApiUrl' props."
      );
    } else if (handleExport) {
      let reqPayload = retrievePayload();
      handleExport(reqPayload, fileType);
    }
    setOpen(false);
  };

  const currentFilters = localFilterModel.items || [];
  const hasMultipleFilters = currentFilters.length > 1;

  return (
    <Toolbar>
      {/* --- Export Button & Menu --- */}
      <Tooltip title="Export">
        <ToolbarButton
          ref={exportTriggerRef}
          aria-describedby="export-menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <FileDownloadIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        id="export-menu"
        anchorEl={exportTriggerRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={() => exportMenuClick("csv")}>
          Download as CSV
        </MenuItem>
        <MenuItem onClick={() => exportMenuClick("excel")}>
          Download as Excel
        </MenuItem>
      </Menu>

      {/* --- Filter Button & Popper --- */}
      <Tooltip title="Filters">
        <ToolbarButton
          ref={newPanelTriggerRef}
          aria-describedby="filter-panel"
          onClick={() => setNewPanelOpen((prev) => !prev)}
        >
          <FilterListIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>

      {externalLoading && <CircularProgress size={16} />}

      <Popper
        open={newPanelOpen}
        anchorEl={newPanelTriggerRef.current}
        placement="bottom-end"
        id="filter-panel"
        onKeyDown={handleKeyDown}
      >
        <Paper
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            width: 600,
          }}
          elevation={8}
        >
          {(currentFilters.length === 0 || !currentFilters[0]?.field
            ? [{ field: "", operator: "contains", value: "" }]
            : currentFilters
          ).map((item: any, index: number) => (
            <Box
              key={index}
              sx={{ display: "flex", gap: 1, alignItems: "center" }}
            >
              <IconButton
                size="small"
                color="error"
                disabled={currentFilters.length <= 1}
                onClick={() => removeFilter(index)}
              >
                <ClearIcon fontSize="small" />
              </IconButton>

              {hasMultipleFilters && (
                <Select
                  label="Linking Operator"
                  size="small"
                  value={localFilterModel.logicOperator || "and"}
                  onChange={updateLinkingOperator}
                  sx={{
                    visibility: index > 0 ? "visible" : "hidden",
                    minWidth: 80,
                  }}
                  MenuProps={{
                    disablePortal: true,
                  }}
                >
                  {["And", "Or"].map((op, id) => (
                    <MenuItem key={id} value={op.toLowerCase()}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              )}

              <FormControl
                sx={{ m: 1, minWidth: 150, textAlign: "left" }}
                size="small"
              >
                <InputLabel id={`column-select-${index}`}>Column</InputLabel>
                <Select
                  labelId={`column-select-${index}`}
                  value={item.field || ""}
                  label="Column"
                  onChange={(e) => updateFilter(index, "field", e.target.value)}
                >
                  {columns?.length ? (
                    columns.map((column: any) => (
                      <MenuItem key={column.field} value={column.field}>
                        {column.headerName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">No columns available</MenuItem>
                  )}
                </Select>
              </FormControl>

              {filterMap && filterMap[item.field] ? (
                <Select
                  label="operator"
                  size="small"
                  value={"equals"}
                  onChange={(e) => updateFilter(index, "operator", "equals")}
                >
                  <MenuItem key={"equals"} value={"equals"}>
                    equals
                  </MenuItem>
                </Select>
              ) : (
                <Select
                  label="operator"
                  size="small"
                  value={item.operator || "contains"}
                  onChange={(e) =>
                    updateFilter(index, "operator", e.target.value)
                  }
                >
                  {operators.map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              )}

              {filterMap && filterMap[item.field] ? (
                <Select
                  label="Value"
                  size="small"
                  value={item.value || ""}
                  onChange={(e) => updateFilter(index, "value", e.target.value)}
                >
                  {filterMap[item.field].map((value: any) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <TextField
                  label={item.field === "createdAt" ? "" : "Value"}
                  type={item.field === "createdAt" ? "date" : "text"}
                  size="small"
                  value={item.value ?? ""}
                  onChange={(e) => updateFilter(index, "value", e.target.value)}
                />
              )}

              <IconButton
                size="small"
                color="primary"
                onClick={addFilter}
                sx={{ width: 50, mr: 2, ml: 2 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              onClick={handleClose}
              startIcon={<Close />}
            >
              Close Filter
            </Button>
            <Button
              variant="outlined"
              onClick={handleSendFilter}
              startIcon={<Check />}
            >
              Apply Filter
            </Button>
          </Stack>
        </Paper>
      </Popper>

      {/* --- Active Filter Chips --- */}
      <Stack direction="row" sx={{ gap: 0.5, flex: 1, pl: 2 }}>
        {filterModel?.items?.map((filter: any, id: number) => {
          if (!filter.field || !filter.value) return null;
          const column = columns.find((c: any) => c.field === filter.field);
          const field = column?.headerName ?? filter.field;
          return (
            <Chip
              key={`${filter.field}-${filter.value}-${id}`}
              label={`${field}: ${filter.value}`}
              onDelete={() => removeFilter(id)}
              sx={{ mx: 0.25 }}
            />
          );
        })}
      </Stack>
    </Toolbar>
  );
};

export default XtendedMuiGridToolbar;
