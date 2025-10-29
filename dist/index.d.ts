import * as react_jsx_runtime from 'react/jsx-runtime';
import { JSX } from 'react/jsx-runtime';
import { GridColDef } from '@mui/x-data-grid';
export { GridColDef } from '@mui/x-data-grid';

declare const FETCH_MODE: {
    readonly GET: "get";
    readonly POST: "post";
};
type FilterItem = {
    field: string;
    operator: string;
    value: string | number;
};
type FilterPayload = {
    filter?: {
        items: FilterItem[];
        logicOperator?: "and" | "or";
    };
    sort?: {
        field: string;
        sort: "asc" | "desc";
    }[];
    limit?: number;
    offset?: number;
    [key: string]: any;
};
type FilterPayloadDef = FilterPayload | URLSearchParams;
type CustomDataGridDef = {
    columns: GridColDef[];
    externalLoading?: Boolean;
    filterMap?: Record<string, any[]>;
    defaultFilter: Array<Record<string, any>>;
    getRowId?: (row: any) => string;
    handleFilterChange: (payload: FilterPayloadDef) => void;
    slotProps?: Record<string, any>;
    gridData: Record<string, any>;
    renderRowMenu?: (business: any, onClose: () => void) => JSX.Element;
    handleExport?: (payload: FilterPayloadDef, fileType: "csv" | "excel") => void;
    csvExportUrl?: string;
    excelExportUrl?: string;
    exportFileName?: string;
    fetchMode?: (typeof FETCH_MODE)[keyof typeof FETCH_MODE];
};
interface XtendedMuiGridToolbarProps {
    columns: CustomDataGridDef["columns"];
    filterMap: CustomDataGridDef["filterMap"];
    csvExportUrl: CustomDataGridDef["csvExportUrl"];
    excelExportUrl: CustomDataGridDef["excelExportUrl"];
    exportFileName: CustomDataGridDef["exportFileName"];
    handleExport: CustomDataGridDef["handleExport"];
    externalLoading: CustomDataGridDef["externalLoading"];
    filterModel: any;
    setFilterModel: React.Dispatch<React.SetStateAction<any>>;
    emitOnFilterModelChange: (filterModel: any) => void;
    retrievePayload: () => FilterPayloadDef;
    defaultFilter: CustomDataGridDef["defaultFilter"];
    fetchMode?: (typeof FETCH_MODE)[keyof typeof FETCH_MODE];
}

declare function XtendedMuiGrid(props: CustomDataGridDef): react_jsx_runtime.JSX.Element;

export { FETCH_MODE, XtendedMuiGrid as default };
export type { CustomDataGridDef, FilterItem, FilterPayload, FilterPayloadDef, XtendedMuiGridToolbarProps };
