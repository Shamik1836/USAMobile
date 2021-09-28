import { Box, Heading } from "@chakra-ui/react";
import { TokenTable } from "../components/Blocks/TokenTable";

export const PortfolioPrices = () => {
  return (
    <Box align="center">
      <Heading>Portfolio and Prices</Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
