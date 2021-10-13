import { HStack, VStack, useColorMode } from "@chakra-ui/react";

import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";

// Swap mode.
import { ToSelect } from "../Bits/ToSelect";
import { RequestQuote } from "../Bits/RequestQuote";

import { QuotePanel } from "../Scrapbox/QuotePanel";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,blue.900,grey,blue.900)";

export const SwapPanel = () => {
  const { fromSymbol } = useActions();
  const { colorMode } = useColorMode();
  const { quoteValid } = useQuote();

  return (
    <VStack
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderRadius="3xl"
      paddingLeft={10}
      paddingRight={10}
      paddingTop={5}
      paddingBottom={5}
      spacing={6}
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
    >
      <FromSelect />
      {!!fromSymbol && (
        <>
          <HStack>
            <AmountSelect />
            <ToSelect visible={fromSymbol === "" ? "hidden" : "visible"} />
          </HStack>
          <RequestQuote />
        </>
      )}
      {quoteValid === "true" && <QuotePanel />}
    </VStack>
  );
};
