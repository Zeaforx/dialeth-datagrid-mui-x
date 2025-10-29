import * as React from "react";
import { Menu, MenuItem } from "@mui/material";
import { CustomDataGridDef } from "./types";

interface XtendedMuiGridRowMenuProps {
  renderRowMenu: CustomDataGridDef["renderRowMenu"];
  rowMenuAnchor: HTMLElement | null;
  rowMenuData: any; // TODO: Use a more specific type for row data
  handleCloseRowMenu: () => void;
}

const XtendedMuiGridRowMenu: React.FC<XtendedMuiGridRowMenuProps> = ({
  renderRowMenu,
  rowMenuAnchor,
  rowMenuData,
  handleCloseRowMenu,
}) => {
  if (!renderRowMenu) {
    return null;
  }

  return (
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
  );
};

export default XtendedMuiGridRowMenu;
