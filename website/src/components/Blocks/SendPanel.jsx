import { HStack, VStack, useColorMode } from "@chakra-ui/react";

import { useActions } from "../../contexts/actionsContext";
import { useGradient } from "../../contexts/gradientsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";
import { StartSend } from "../Bits/StartSend";

// Send mode.
import { ToAddress } from "../Bits/ToAddress";

export const SendPanel = () => {
  const { fromSymbol } = useActions();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();

  return (
    <VStack
      alignItems="flex-start"
      borderWidth={2}
      borderRadius="3xl"
      paddingLeft={10}
      paddingRight={10}
      paddingTop={5}
      paddingBottom={5}
      spacing={5}
      bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
    >
      <FromSelect />
      {!!fromSymbol && (
        <>
          <AmountSelect />
          <ToAddress />
          <HStack alignItems="center" justifyContent="center" width="100%">
            <StartSend />
          </HStack>
        </>
      )}
    </VStack>
  );
};
