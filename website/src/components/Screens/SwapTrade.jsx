import { useEffect } from "react";
import { Box } from "@mui/material";

import { SwapPanel } from "../Blocks/SwapPanel";
import { Heading } from "../UW/Heading";

import { usePolygonNetwork } from "../../hooks/usePolygonNetwork";

import { useExperts } from "../../contexts/expertsContext";

export const SwapTrade = () => {
  const { setActionMode, setDialog } = useExperts();
  const { isPolygon } = usePolygonNetwork();
  useEffect(() => {
    if (!isPolygon) {
      setDialog("Switch to Polygon.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolygon, setDialog]);
  

  useEffect(() => {
    setActionMode("swap");
    setDialog("Select a token to convert.");
  }, [setActionMode, setDialog]);

  return (
    <Box sx={{ textAlign: "center", mt: 1 }}>
      <Heading variant="h4">Swap/Trade</Heading>
      <br />
      <SwapPanel />
    </Box>
  );
};
