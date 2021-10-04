import { HStack, VStack, useColorMode } from "@chakra-ui/react";

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";

// Swap mode.
import { ToSelect } from "../Bits/ToSelect";
import { RequestQuote } from "../Bits/RequestQuote";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const SwapPanel = () => {
  const { txAmount, fromSymbol, toSymbol } = useActions();
  const { colorMode } = useColorMode();

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
      {fromSymbol !== "" && (
        <>
          <HStack>
            <AmountSelect />
            {txAmount && (
              <ToSelect visible={fromSymbol === "" ? "hidden" : "visible"} />
            )}
          </HStack>
          {toSymbol && <RequestQuote />}
        </>
      )}
    </VStack>
  );
};
