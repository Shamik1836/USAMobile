import { HStack, VStack, useColorMode } from "@chakra-ui/react";
import { useGradient } from "../../contexts/gradientsContext";
import { useActions } from "../../contexts/actionsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";

// Swap mode.
import { ToSelect } from "../Bits/ToSelect";
import { RequestQuote } from "../Bits/RequestQuote";

export const SwapPanel = () => {
  const { txAmount, fromSymbol, toSymbol } = useActions();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();

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
