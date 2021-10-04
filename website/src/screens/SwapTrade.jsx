import { Box, Heading } from "@chakra-ui/react";
import { SwapPanel } from "../components/Blocks/SwapPanel";

export const SwapTrade = () => {
  return (
    <Box align="center">
      <Heading>Swap/Trade</Heading>
      <br />
      <SwapPanel />
    </Box>
  );
};
