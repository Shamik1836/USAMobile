import { useEffect } from "react";

import { Box } from "@mui/material";
import { useMoralis } from "react-moralis";


import { TokenTable } from "../Blocks/TokenTable";
import { Heading } from "../UW/Heading";

import { useExperts } from "../../contexts/expertsContext";
import { useNetwork } from "../../contexts/networkContext";
import { usePolygonNetwork } from "../../hooks/usePolygonNetwork";


export const PortfolioPrices = () => {
  const { setActionMode, setDialog } = useExperts();

  const { isAuthenticated } = useMoralis();
  const { isPolygon } = useNetwork();
  const { switchNetworkToPolygon } = usePolygonNetwork();

  useEffect(() => {
     if (isAuthenticated) {
        if (!isPolygon) {
          setDialog("Check your Metamast and Accept Polygon Switch.")
          switchNetworkToPolygon();
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPolygon]);

  useEffect(() => {
    setActionMode("portfolio");
    setDialog("Select a currency to view transaction histories.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ textAlign: "center", mt: 1, mb: 3 }}>
      <Heading variant="h4">Portfolio and Prices</Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
