import * as React from "react";
import { Box, Input, Button } from "@mui/material";

interface XtendedMuiGridPaginationControlsProps {
  pagination: { page: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ page: number; pageSize: number }>
  >;
  pageCount: number | undefined;
}

const XtendedMuiGridPaginationControls: React.FC<
  XtendedMuiGridPaginationControlsProps
> = ({ pagination, setPagination, pageCount }) => {
  const [jumpPage, setJumpPage] = React.useState<string>("");

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpPage, 10);
    if (
      !isNaN(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= (pageCount || 1)
    ) {
      setPagination((prev) => ({ ...prev, page: pageNumber - 1 }));
    }
    setJumpPage("");
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
      <Input
        placeholder={`Page ${pagination.page + 1} of ${pageCount || 1}`}
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
  );
};

export default XtendedMuiGridPaginationControls;
