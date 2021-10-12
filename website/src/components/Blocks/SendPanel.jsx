import { useEffect } from "react";
import { HStack, VStack, useColorMode } from "@chakra-ui/react";

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";
import { StartSend } from "../Bits/StartSend";

// Send mode.
import { ToAddress } from "../Bits/ToAddress";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,blue.900,grey,blue.900)";

export const SendPanel = () => {
  const { txAmount, fromSymbol, toAddress } = useActions();
  const { setActionMode, setDialog } = useExperts();
  const { colorMode } = useColorMode();

  useEffect(() => {
    setActionMode("send");
    setDialog("Select a token to send.");
  });

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
        <VStack>
          <HStack>
            <AmountSelect />
            {txAmount && (
              <ToAddress visible={fromSymbol === "" ? "hidden" : "visible"} />
            )}
          </HStack>
          {toAddress && <StartSend />}
        </VStack>
      )}
      <br />
    </VStack>
  );
};
