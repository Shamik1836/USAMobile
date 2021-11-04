import { useEffect } from "react";

import { Box } from "@mui/material";

import { TokenTable } from "../Blocks/TokenTable";
import { useExperts } from "../../contexts/expertsContext";
import { Heading } from "../UW/Heading";

export const PortfolioPrices = () => {
  const { setActionMode, setDialog } = useExperts();

  useEffect(() => {
    setActionMode("portfolio");
    setDialog("Select a currency to view transaction histories.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  },[setDialog, setActionMode]);
  
  return (
    <Box sx={{ textAlign: "center", mt: 1, mb: 3 }}>
      <Heading variant="h4">Portfolio and Prices</Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
