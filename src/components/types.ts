import type { GridColDef } from "@mui/x-data-grid";
import { JSX } from "react/jsx-runtime";

export const FETCH_MODE = {
  GET: "get",

  POST: "post",
} as const;

export type FilterItem = {
  field: string;

  operator: string;

  value: string | number;
};

export type FilterPayload = {
  filter?: {
    items: FilterItem[];

    logicOperator?: "and" | "or";
  };

  sort?: { field: string; sort: "asc" | "desc" }[];

  limit?: number;

  offset?: number;

  [key: string]: any; // index signature
};

export type FilterPayloadDef = FilterPayload | URLSearchParams;

export type CustomDataGridDef = {
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
