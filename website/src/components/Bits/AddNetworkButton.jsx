import { IconButton, Tooltip } from "@mui/material";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

import { usePolygonNetwork } from "../../hooks/usePolygonNetwork";

export const AddNetworkButton = (props) => {
  const { addPolygonNetwork } = usePolygonNetwork();

  return (
    <Tooltip title="Add Polygon Network to MetaMask">
      <IconButton
        aria-label="Add Polygon Network"
        sx={{ boxShadow: "var(--boxShadow)" }}
        variant="uw"
        onClick={addPolygonNetwork}
      >
        <AllInclusiveIcon className="nav-bar-icon" />
      </IconButton>
    </Tooltip>
  );
};
