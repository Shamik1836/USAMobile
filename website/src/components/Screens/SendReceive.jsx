import { useState, useEffect } from "react";
import { Box, Button, Heading, HStack, VStack } from "@chakra-ui/react";
import { SendPanel } from "../Blocks/SendPanel";
import { AddressPanel } from "../Blocks/AddressPanel";
import { useExperts } from "../../contexts/expertsContext";

export const SendReceive = () => {
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState("none");

  useEffect(() => {
    setActionMode("send");
    setDialog("Would you like to send or receive cryptocurrency?");
  }, [setActionMode, setDialog]);

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
