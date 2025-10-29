import * as React from "react";
import { Toolbar, ToolbarButton, DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Menu,
  MenuItem,
  Select,
  TextField,
  IconButton,
  CircularProgress,
  Button,
  Input,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tooltip from "@mui/material/Tooltip";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import FilterListIcon from "@mui/icons-material/FilterList";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  FETCH_MODE,
  FilterPayload,
  FilterPayloadDef,
  CustomDataGridDef,
} from "./types";
import axios from "axios";
import { Check, Close } from "@mui/icons-material";

// Configure your API base URL here
const baseUrl = "https://example.com";

// Request utility using axios for API calls
const request = {
  post: async ({ url, data, method = "POST" }: any): Promise<any> => {
    const headers = {};
    try {
      const response = await axios({
        method,
        url: baseUrl + url,
        headers,
        data,
      });

      return response.data;
    } catch (err: any) {
      const data = err.response.data;
      console.error("API Error:", data);
      throw data;
    }
  },
  get: async ({ url, method = "GET" }: { url: string; method?: string }) => {
    try {
      const headers = {};
      const response = await axios({
        url: baseUrl + url,
        headers,
        method,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (url: string) => await request.get({ url, method: "DELETE" }),
  patch: async (params: any) =>
    await request.post({ ...params, method: "PATCH" }),
};

function XtendedMuiGrid(props: CustomDataGridDef) {
  // Destructure props
  const {
    columns,
    defaultFilter,
    handleFilterChange,
    gridData,
    handleExport,
    filterMap, // Optional: maps column fields to dropdown values for select-based filtering
    csvExportUrl,
    excelExportUrl,
    exportFileName,
    externalLoading, // Shows loading spinner when parent component is processing
    getRowId, // Custom function to extract unique row identifier
    renderRowMenu, // Optional: renders custom context menu for row clicks
    fetchMode = FETCH_MODE.GET,
  } = props;

  // Sort configuration - defaults to createdAt descending
  const [sortModel, setSortModel] = React.useState<
    { field: string; sort: "asc" | "desc" }[]
  >([{ field: "createdAt", sort: "desc" }]);

  // Pagination state
  const [pagination, setPagination] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [jumpPage, setJumpPage] = React.useState<string>(); // Input value for jump-to-page feature
  const [pageCount, setPageCount] = React.useState<number>(); // Total number of pages
  const [pageId, setPageId] = React.useState<number>();

  // Active filters applied to the grid
  const [filterModel, setFilterModel] = React.useState<any>({
    items: defaultFilter,
  });

  // Dynamic page size options including an "All" option
  const pageSizeOptions = [
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 100, label: "100" },
    ...(gridData?.total ? [{ value: gridData.total, label: "All" }] : []),
  ];

  // Stores the value of the "Go to Page" input field
  const [jumpPage, setJumpPage] = React.useState<string>();

  // Stores the total number of pages, calculated from gridData.total
  const [pageCount, setPageCount] = React.useState<number>();

  // Handles filter changes emitted via custom events
  const handleFilterModelChange = (e: any) => {
    if (!e.detail) return;
    const newFilterModel = e.detail;
    if (JSON.stringify(newFilterModel) !== JSON.stringify(filterModel)) {
      setFilterModel(newFilterModel);
    }
    // Reset to first page when filters change
    setPagination({
      page: newFilterModel.page || 0,
      pageSize: newFilterModel.pageSize || 10,
    });
  };

  /**
   * Called by DataGrid when the user clicks a column header to sort.
   * Updates the `sortModel` state, which triggers the data fetching useEffect.
   */
  const handleSortModelChange = (newSortModel: any) => {
    if (JSON.stringify(newSortModel) !== JSON.stringify(sortModel)) {
      setSortModel(newSortModel);
    }
  };

  const handlePaginationChange = (newPagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination({
      page: newPagination.page,
      pageSize: newPagination.pageSize,
    });
  };

  // Emits filter changes as custom events for internal communication
  const emitOnFilterModelChange = (filterModel: any) => {
    const event = new CustomEvent("onFilterChange", {
      detail: filterModel,
    });
    window.dispatchEvent(event);
  };

  // Builds URL search params for GET requests
  const buildParams = (payload: FilterPayload): URLSearchParams => {
    const params = new URLSearchParams();
    if (payload.filter) {
      params.append("filter", JSON.stringify(payload.filter));
    }
    if (payload.sort) {
      params.append("sort", JSON.stringify(payload.sort));
    }
    if (payload.limit !== undefined) {
      params.append("limit", String(payload.limit));
    }
    if (payload.offset !== undefined && !isNaN(payload.offset)) {
      params.append("offset", String(payload.offset));
    }
    // Append any additional custom parameters
    Object.keys(payload).forEach((key) => {
      if (!["filter", "sort", "limit", "offset"].includes(key)) {
        params.append(key, String(payload[key]));
      }
    });
    return params;
  };

  // Prepares the request payload based on fetch mode (GET or POST)
  const retrievePayload = (): FilterPayloadDef => {
    let reqPayload: any = null;
    if (fetchMode === FETCH_MODE.GET) {
      reqPayload = buildParams({
        filter: filterModel,
        sort: sortModel,
        limit: pagination.pageSize || 10,
        offset: isNaN(pagination.page * pagination.pageSize)
          ? 0
          : pagination.page * pagination.pageSize,
      });
      return reqPayload;
    } else {
      reqPayload = {
        filter: filterModel,
        sort: sortModel,
        limit: pagination.pageSize || 10,
        offset: isNaN(pagination.page * pagination.pageSize)
          ? 0
          : pagination.page * pagination.pageSize,
      };
    }
    return reqPayload;
  };

  // Fetch data whenever pagination, sort, or filters change
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let reqPayload = retrievePayload();
        // Call the parent's function to fetch data
        handleFilterChange(reqPayload);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pagination, sortModel, filterModel]); // Dependency array

  // Set up event listener for filter changes
  React.useEffect(() => {
    window.addEventListener("onFilterChange", handleFilterModelChange);
    return () =>
      window.removeEventListener("onFilterChange", handleFilterModelChange);
  }, []);

  // Calculate total page count when data or page size changes
  React.useEffect(() => {
    setPageCount(
      gridData && gridData.total && pagination.pageSize
        ? Math.ceil(gridData.total / pagination.pageSize)
        : 0
    );
  }, [gridData, pagination.pageSize]);

  const operators = ["equals", "contains", ">", "<"];

  const CustomToolbar = () => {
    const [newPanelOpen, setNewPanelOpen] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    // Local filter state allows users to configure filters before applying them
    const [localFilterModel, setLocalFilterModel] = React.useState(filterModel);

    const newPanelTriggerRef = React.useRef<HTMLButtonElement>(null);
    const exportTriggerRef = React.useRef<HTMLButtonElement>(null);

    // Sync local filters with global filters when panel opens
    React.useEffect(() => {
      if (newPanelOpen) {
        setLocalFilterModel(filterModel);
      }
    }, [newPanelOpen, filterModel]);

    // Initialize filters from defaultFilter prop
    React.useEffect(() => {
      if (defaultFilter && defaultFilter.length) {
        defaultFilter.forEach((filter, idx) => {
          updateFilter(idx, "field", filter.field);
          updateFilter(idx, "operator", filter.operator);
          updateFilter(idx, "value", filter.value);
        });
      }
    }, []);

    const handleClose = () => {
      setNewPanelOpen(false);
    };

    // Keyboard shortcuts for filter panel
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
      if (event.key === "Enter" && newPanelOpen) {
        emitOnFilterModelChange(localFilterModel);
        setNewPanelOpen(false);
      }
    };

    // Apply filters and close panel
    const handleSendFilter = (): any => {
      emitOnFilterModelChange(localFilterModel);
      setNewPanelOpen(false);
    };

    // Add a new filter row
    const addFilter = () => {
      setLocalFilterModel((prev: any) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            field:
              columns.filter((item) => !prev.items.includes(item.field))[0]
                ?.field || defaultFilter[0].field,
            operator: "contains",
            value: "",
          },
        ],
      }));
    };

    // Update a specific filter property (field, operator, or value)
    const updateFilter = (index: number, key: string, value: any) => {
      setLocalFilterModel((prev: any) => {
        const items = prev.items.map((item: any) => ({ ...item }));
        if (!items[index]) {
          items[index] = { field: "", operator: "contains", value: "" };
          (items[index] as any)[key] = value;
        } else {
          (items[index] as any)[key] = value;
        }
        return { ...prev, items };
      });
    };

    // Update the AND/OR logic operator between filters
    const updateLinkingOperator = (e: any) => {
      if (!e.target || !e.target.value) return;
      const newOperator = e.target.value.toLowerCase();
      setLocalFilterModel((prev: any) => ({
        ...prev,
        logicOperator: newOperator,
      }));
    };

    // Remove a filter row at the specified index
    const removeFilter = (index: number) => {
      setFilterModel((prev: any) => {
        const items = prev.items.filter(
          (item: any, i: number) => item && i !== index
        );
        return { ...prev, items };
      });
      setLocalFilterModel((prev: any) => {
        const items = prev.items.filter(
          (item: any, i: number) => item && i !== index
        );
        return { ...prev, items };
      });
    };

    // Handle CSV or Excel export
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

        // Fetch export data from API
        const getBusinesses = async () => {
          const reqPayload = retrievePayload();
          const { data } = await request.get({
            url: `/businesses/export/${fileType}?${reqPayload}`,
          });
          return data;
        };

        const response = await getBusinesses();

        // Handle Buffer response from backend
        if (response?.type === "Buffer" && response?.data) {
          const byteArray = new Uint8Array(response.data);
          const blob = new Blob([byteArray], {
            type:
              fileType === "excel"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv",
          });

          // Trigger download
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          const ext = fileType === "csv" ? "csv" : "xlsx";
          link.download = `${exportFileName || "my-data"}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error("The API response format is not a Buffer.");
        }
      } else if ((handleExport && excelExportUrl) || csvExportUrl) {
        console.error(
          "Can not set both 'handleExport' and 'exportApiUrl' props."
        );
      } else if (handleExport) {
        // Use custom export handler if provided
        let reqPayload = retrievePayload();
        handleExport(reqPayload, fileType);
      }
    };

    return (
      <Toolbar>
        {/* Export button with dropdown menu */}
        <Tooltip title="Export">
          <ToolbarButton
            ref={exportTriggerRef}
            aria-describedby="new-panel"
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

        {/* Filter button */}
        <Tooltip title="Filters">
          <ToolbarButton
            ref={newPanelTriggerRef}
            aria-describedby="new-panel"
            onClick={() => setNewPanelOpen((prev) => !prev)}
          >
            <FilterListIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>

        {/* Loading indicator for external operations */}
        {externalLoading && <CircularProgress size={16} />}

        {/* Filter configuration panel */}
        <Popper
          open={newPanelOpen}
          anchorEl={newPanelTriggerRef.current}
          placement="bottom-end"
          id="new-panel"
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
            {(localFilterModel.items && localFilterModel.items?.length
              ? localFilterModel.items
              : [{ field: "", operator: "contains", value: "" }]
            ).map((item: any, index: number) => (
              <Box
                key={index}
                sx={{ display: "flex", gap: 1, alignItems: "center" }}
              >
                {/* Delete filter button */}
                <IconButton
                  size="small"
                  color="error"
                  disabled={index <= 0}
                  onClick={() => removeFilter(index)}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>

                {/* AND/OR linking operator (hidden for first filter) */}
                {localFilterModel.items?.length > 1 ? (
                  <Select
                    label="Linking Operator"
                    size="small"
                    defaultValue={"And"}
                    onChange={updateLinkingOperator}
                    sx={{
                      visibility: index > 0 ? "visible" : "hidden",
                      minWidth: 80,
                    }}
                    disabled={localFilterModel.items?.length <= 1}
                    MenuProps={{
                      disablePortal: true, // Keeps dropdown inside Popper
                    }}
                  >
                    {["And", "Or"].map((op, id) => (
                      <MenuItem key={id} value={op}>
                        {op}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <></>
                )}

                {/* Column selector */}
                <FormControl
                  sx={{ m: 1, minWidth: 150, textAlign: "left" }}
                  size="small"
                >
                  <InputLabel id="column-select">Column</InputLabel>
                  <Select
                    labelId="column-select"
                    defaultValue={item.field}
                    onClick={(e) => e.stopPropagation()}
                    label="Column"
                    onChange={(e) =>
                      updateFilter(index, "field", e.target.value)
                    }
                  >
                    {columns?.length ? (
                      columns.map((column) => (
                        <MenuItem key={column.field} value={column.field}>
                          {column.headerName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="">No columns available</MenuItem>
                    )}
                  </Select>
                </FormControl>

                {/* Operator selector - uses filterMap if available for dropdown values */}
                {filterMap && filterMap[item.field] ? (
                  <Select
                    label="operator"
                    size="small"
                    defaultValue={"equals"}
                    onClick={(e) => e.stopPropagation()}
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
                    defaultValue={item.operator}
                    onClick={(e) => e.stopPropagation()}
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

                {/* Value input - dropdown if filterMap exists, otherwise text/date field */}
                {filterMap && filterMap[item.field] ? (
                  <Select
                    label="Value"
                    size="small"
                    defaultValue={item.value}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      updateFilter(index, "value", e.target.value)
                    }
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
                    defaultValue={item.value ?? ""}
                    onChange={(e) =>
                      updateFilter(index, "value", e.target.value)
                    }
                  />
                )}

                {/* Add filter button */}
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

            {/* Filter panel action buttons */}
            <Button sx={{}} variant="outlined" onClick={handleClose}>
              <Close />
              Close Filter
            </Button>
            <Button sx={{}} variant="outlined" onClick={handleSendFilter}>
              <Check />
              Send Filter
            </Button>
          </Paper>
        </Popper>

        {/* Active filter chips display */}
        <Stack direction="row" sx={{ gap: 0.5, flex: 1, pl: 2 }}>
          {filterModel?.items.map((filter: any, id: number) => {
            if (!filter.field || !filter.value) return null;
            const column = columns[filter.field];
            const field = column?.headerName ?? filter.field;
            return (
              <Chip
                key={filter.id}
                label={`${field}`}
                onDelete={() => removeFilter(id)}
                sx={{ mx: 0.25 }}
              />
            );
          })}
        </Stack>
      </Toolbar>
    );
  };

  // Row context menu state
  const [rowMenuAnchor, setRowMenuAnchor] = React.useState<null | HTMLElement>(
    null
  );
  const [rowMenuData, setRowMenuData] = React.useState<any>(null);

  // Handle row click to open context menu (left-click only)
  const handleRowClickMenu = (params: any, event: React.MouseEvent) => {
    if (event.button === 0) {
      setRowMenuAnchor(event.target as HTMLElement);
      setRowMenuData(params.row);
    }
  };

  const handleCloseRowMenu = () => {
    setRowMenuAnchor(null);
    setRowMenuData(null);
  };

  // Navigate to a specific page number
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpPage || "", 10);
    console.log(pageNumber);
    if (
      !isNaN(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= (pageCount || 1)
    ) {
      setPagination && setPagination((prev) => ({ ...prev, page: pageNumber }));
    }
    setJumpPage("");
  };

  return (
    <>
      <DataGrid
        rows={isLoading ? [] : gridData?.data}
        getRowId={getRowId}
        columns={columns}
        rowCount={gridData.total || 0}
        pagination
        paginationModel={pagination}
        onSortModelChange={handleSortModelChange}
        onPaginationModelChange={handlePaginationChange}
        filterMode="server"
        sortingMode="server"
        paginationMode="server"
        loading={isLoading}
        slots={{
          toolbar: CustomToolbar,
        }}
        showToolbar
        disableRowSelectionOnClick
        disableColumnMenu={true}
        pageSizeOptions={pageSizeOptions}
        onRowClick={handleRowClickMenu}
        onRowDoubleClick={(params, event) => {
          event.defaultMuiPrevented = true;
        }}
      />

      {/* Jump to page input */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
        <Input
          placeholder={`Page ${
            pagination.page === 0 ? 1 : pagination.page
          } of ${pageCount || 1}`}
          type="number"
          size="small"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: pageCount }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleJumpToPage}
          disabled={!jumpPage || isNaN(parseInt(jumpPage, 10))}
        >
          Go
        </Button>
      </Box>

      {/* Custom row context menu */}
      {renderRowMenu && (
        <Menu
          open={Boolean(rowMenuAnchor)}
          anchorEl={rowMenuAnchor}
          onClose={handleCloseRowMenu}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {renderRowMenu(rowMenuData, handleCloseRowMenu)}

          <MenuItem onClick={handleCloseRowMenu}>Close</MenuItem>
        </Menu>
      )}
    </>
  );
}

export { XtendedMuiGrid };
