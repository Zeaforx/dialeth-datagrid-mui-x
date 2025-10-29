import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  FETCH_MODE,
  FilterPayload,
  FilterPayloadDef,
  CustomDataGridDef,
} from "./types";
import XtendedMuiGridToolbar from "./XtendedMuiGridToolbar";
import XtendedMuiGridPaginationControls from "./XtendedMuiGridPaginationControls";
import XtendedMuiGridRowMenu from "./XtendedMuiGridRowMenu";

function XtendedMuiGrid(props: CustomDataGridDef) {
  // Destructure props
  const {
    columns,
    defaultFilter, // Initial filters to apply on load
    handleFilterChange, // Callback to parent to fetch data
    gridData, // The data object from the parent (e.g., { data: [], total: 0 })
    handleExport, // Optional custom export handler
    filterMap, // A map to define dropdown values for certain filters
    csvExportUrl, // API endpoint for CSV export
    excelExportUrl, // API endpoint for Excel export
    exportFileName, // Base name for exported files
    externalLoading, // Prop to show loading from parent
    getRowId, // Function to get a unique row ID
    renderRowMenu, // Function to render a custom row context menu
    fetchMode = FETCH_MODE.GET, // API request method (GET or POST)
  } = props;

  // ---
  // STATE
  // ---

  // Stores the current sort configuration (field and direction)
  const [sortModel, setSortModel] = React.useState<
    { field: string; sort: "asc" | "desc" }[]
  >([{ field: "createdAt", sort: "desc" }]);

  // Stores the current pagination state (page index and size)
  const [pagination, setPagination] = React.useState({
    pageSize: 10,
    page: 0,
  });

  // Manages the loading state of the grid, distinct from externalLoading
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Stores the value of the "Go to Page" input field
  const [jumpPage, setJumpPage] = React.useState<string>();

  // Stores the total number of pages, calculated from gridData.total
  const [pageCount, setPageCount] = React.useState<number>();

  // Stores the *active* filter configuration applied to the grid
  const [filterModel, setFilterModel] = React.useState<any>({
    items: defaultFilter,
  });

  // Options for the "Rows per page" dropdown
  const pageSizeOptions = [
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 100, label: "100" },
    // Add an "All" option if total count is available
    ...(gridData?.total ? [{ value: gridData.total, label: "All" }] : []),
  ];

  // ---
  // CORE HANDLERS
  // ---

  /**
   * Handles the custom 'onFilterChange' event dispatched from the CustomToolbar.
   * Updates the main `filterModel` state, which triggers the data fetching useEffect.
   */
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

  /**
   * Called by DataGrid when the user changes the page or page size.
   * Updates the `pagination` state, which triggers the data fetching useEffect.
   */
  const handlePaginationChange = (newPagination: {
    page: number;
    pageSize: number;
  }) => {
    setPagination({
      page: newPagination.page,
      pageSize: newPagination.pageSize,
    });
  };

  /**
   * Helper function to dispatch a custom browser event.
   * This is used by the CustomToolbar to communicate filter changes
   * back to the main XtendedMuiGrid component.
   */
  const emitOnFilterModelChange = (filterModel: any) => {
    const event = new CustomEvent("onFilterChange", {
      detail: filterModel,
    });
    window.dispatchEvent(event);
  };

  // ---
  // PAYLOAD BUILDERS
  // ---

  /**
   * Helper to build URLSearchParams for GET requests.
   */
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
    // Append any other custom keys
    Object.keys(payload).forEach((key) => {
      if (!["filter", "sort", "limit", "offset"].includes(key)) {
        params.append(key, String(payload[key]));
      }
    });
    return params;
  };

  /**
   * Gathers the current state (filters, sorting, pagination) and builds
   * the payload for the API request.
   * @returns {FilterPayloadDef} Either a URLSearchParams object (for GET) or a JSON object (for POST).
   */
  const retrievePayload = (): FilterPayloadDef => {
    let reqPayload: any = null;
    const offset = pagination.page * pagination.pageSize;
    const commonPayload = {
      filter: filterModel,
      sort: sortModel,
      limit: pagination.pageSize || 10,
      offset: isNaN(offset) ? 0 : offset,
    };

    if (fetchMode === FETCH_MODE.GET) {
      reqPayload = buildParams(commonPayload);
      return reqPayload;
    } else {
      reqPayload = commonPayload;
    }
    return reqPayload;
  };

  // ---
  // DATA FETCHING & LIFECYCLE
  // ---

  /**
   * This is the MAIN data fetching trigger.
   * It watches for changes in pagination, sorting, or filtering.
   * When a change occurs, it builds the API payload and calls the
   * `handleFilterChange` prop, delegating the actual API call to the parent.
   */
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

  /**
   * Effect to set up the global event listener for filter changes
   * from the CustomToolbar.
   */
  React.useEffect(() => {
    window.addEventListener("onFilterChange", handleFilterModelChange);
    return () =>
      window.removeEventListener("onFilterChange", handleFilterModelChange);
  }, []); // Runs once on mount

  /**
   * Effect to recalculate the total page count whenever the
   * grid data or page size changes.
   */
  React.useEffect(() => {
    setPageCount(
      gridData && gridData.total && pagination.pageSize
        ? Math.ceil(gridData.total / pagination.pageSize)
        : 0
    );
  }, [gridData?.total, pagination.pageSize]);

  // State for the row context menu anchor
  const [rowMenuAnchor, setRowMenuAnchor] = React.useState<null | HTMLElement>(
    null
  );
  // State to store the data of the clicked row
  const [rowMenuData, setRowMenuData] = React.useState<any>(null);
  /**
   * Opens the row context menu on (left) click.
   */
  const handleRowClickMenu = (params: any, event: React.MouseEvent) => {
    if (event.button === 0) {
      setRowMenuAnchor(event.target as HTMLElement);
      setRowMenuData(params.row);
    }
  };

  /**
   * Closes the row context menu.
   */
  const handleCloseRowMenu = () => {
    setRowMenuAnchor(null);
    setRowMenuData(null);
  };

  // ---
  // MAIN RENDER
  // ---

  return (
    <>
      <DataGrid
        // Data and columns
        rows={isLoading ? [] : gridData?.data}
        getRowId={getRowId}
        columns={columns}
        // Server-side props
        rowCount={gridData.total || 0}
        filterMode="server"
        sortingMode="server"
        paginationMode="server"
        // Pagination state
        pagination
        paginationModel={pagination}
        onPaginationModelChange={handlePaginationChange}
        pageSizeOptions={pageSizeOptions}
        // Sort state
        onSortModelChange={handleSortModelChange}
        // Loading state
        loading={isLoading}
        // Toolbar
        slots={{
          toolbar: () => (
            <XtendedMuiGridToolbar
              columns={columns}
              filterMap={filterMap}
              csvExportUrl={csvExportUrl}
              excelExportUrl={excelExportUrl}
              exportFileName={exportFileName}
              handleExport={handleExport}
              externalLoading={externalLoading}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              emitOnFilterModelChange={emitOnFilterModelChange}
              retrievePayload={retrievePayload}
              defaultFilter={defaultFilter}
              fetchMode={fetchMode}
            />
          ),
        }}
        showToolbar
        // Row menu handlers
        onRowClick={handleRowClickMenu}
        onRowDoubleClick={(params, event) => {
          // Prevent default MUI behavior on double click if needed
          event.defaultMuiPrevented = true;
        }}
        // Other options
        disableRowSelectionOnClick
        disableColumnMenu={true}
      />

      {/* "Go to Page" Input Box */}
      <XtendedMuiGridPaginationControls
        pagination={pagination}
        setPagination={setPagination}
        pageCount={pageCount}
      />

      {/* Row Context Menu (renders if renderRowMenu prop is provided) */}
      <XtendedMuiGridRowMenu
        renderRowMenu={renderRowMenu}
        rowMenuAnchor={rowMenuAnchor}
        rowMenuData={rowMenuData}
        handleCloseRowMenu={handleCloseRowMenu}
      />
    </>
  );
}

export { XtendedMuiGrid };
