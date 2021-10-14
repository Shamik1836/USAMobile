import { useEffect } from "react";
import { Box, Heading } from "@chakra-ui/react";
import { SwapPanel } from "../Blocks/SwapPanel";
import { useExperts } from "../../contexts/expertsContext";

export const SwapTrade = () => {
  const { setActionMode, setDialog } = useExperts();

  useEffect(() => {
    setActionMode("swap");
    setDialog("Select a token to convert.");
  }, []);

  return (
    <Box align="center">
      <Heading>Swap/Trade</Heading>
      <br />
      <SwapPanel />
    </Box>
  );
};
