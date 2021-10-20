import { HStack, VStack, useColorMode } from "@chakra-ui/react";

import { useActions } from "../../contexts/actionsContext";
import { useGradient } from "../../contexts/gradientsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";
import { StartSend } from "../Bits/StartSend";

// Send mode.
import { ToAddress } from "../Bits/ToAddress";

export const SendPanel = () => {
  const { txAmount, fromSymbol, toAddress } = useActions();
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
      {!!fromSymbol && (
        <VStack>
          <HStack>
            <AmountSelect />
            {txAmount && <ToAddress />}
          </HStack>
          <br />
          {toAddress && <StartSend />}
        </VStack>
      )}
      <br />
    </VStack>
  );
};
