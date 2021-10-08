import { useState, useEffect } from "react";
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
import { useExperts } from "../contexts/expertsContext";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const SendReceive = () => {
  const { colorMode } = useColorMode();
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState("none");

  useEffect(() => {
    setActionMode("send");
    setDialog("Would you like to send or receive cryptocurrency?");
  });

  const handleSendMode = () => {
    setLocalMode("send");
    setActionMode("send");
    setDialog("Select a currency to send.");
  };

  const handleReceiveMode = () => {
    setLocalMode("receive");
    setActionMode("receive");
    setDialog(
      "Copy your address for pasting or " +
        "select amount to request to generate a QR code."
    );
  };

  return (
    <Box align="center">
      <Heading>Transfer Cryptocurrency</Heading>
      <br />
      <VStack>
        <HStack>
          <Button onClick={handleSendMode} boxShadow="dark-lg">
            Send
          </Button>
          <Button onClick={handleReceiveMode} boxShadow="dark-lg">
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
