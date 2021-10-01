import { Box, Heading } from "@chakra-ui/react";
import { IFrame } from "../components/IFrame";

export const BuySell = () => {
  return (
    <Box align="center">
      <Heading>Buy/Sell</Heading>
      <br />
      <IFrame
        source={"https://www.merriam-webster.com/dictionary/test"}
        title={"test"}
      />
    </Box>
  );
};
