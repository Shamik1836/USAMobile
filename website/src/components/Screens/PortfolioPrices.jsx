import { useEffect } from "react";
import { Box, Heading } from "@chakra-ui/react";
import { TokenTable } from "../Blocks/TokenTable";
import { useExperts } from "../../contexts/expertsContext";

export const PortfolioPrices = () => {
  const { setActionMode, setDialog } = useExperts();

  useEffect(() => {
    setActionMode("portfolio");
    setDialog("Select a currency to view transaction histories.");
  }, [setActionMode, setDialog]);

  return (
    <Box align="center">
      <Heading>Portfolio and Prices</Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
