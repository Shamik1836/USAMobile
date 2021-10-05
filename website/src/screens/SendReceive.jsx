import { useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  VStack,
  useColorMode,
} from "@chakra-ui/react";
import { SendPanel } from "../components/Blocks/SendPanel";
import { AddressPanel } from "../components/Blocks/AddressPanel";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const SendReceive = () => {
  const { colorMode } = useColorMode();
  const [localMode, setLocalMode] = useState("none");

  return (
    <Box align="center">
      <Heading>Transfer Cryptocurrency</Heading>
      <br />
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
        <HStack>
          <Button onClick={() => setLocalMode("send")} boxShadow="dark-lg">
            Send
          </Button>
          <Button onClick={() => setLocalMode("receive")} boxShadow="dark-lg">
            Receive
          </Button>
        </HStack>
      </VStack>
      <br />
      {localMode === "send" && <SendPanel />}
      <br />
      {localMode === "receive" && <AddressPanel />}
    </Box>
  );
};
