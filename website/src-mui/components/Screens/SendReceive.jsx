import { useState, useEffect } from "react";
import { Box, Button, Stack } from '@mui/material';

import { SendPanel } from "../Blocks/SendPanel";
import { AddressPanel } from "../Blocks/AddressPanel";
import { Heading } from '../UW/Heading';


import { useExperts } from "../../contexts/expertsContext";
import { useGradient } from "../../contexts/gradientsContext";


export const SendReceive = () => {
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState("none");
  const { darkBoxShadow } = useGradient();


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
    <Box sx={{textAlign:'center', mt:1}}>
      <Heading variant="h4">Transfer Cryptocurrency</Heading>
      <br />
      <Stack sx={{alignItems: 'center'}}>
        <Stack direction="row">
          <Button onClick={handleSendMode} sx={{mr:1,boxShadow:darkBoxShadow}}>
            Send
          </Button>
          <Button onClick={handleReceiveMode} sx={{boxShadow:darkBoxShadow}}>
            Receive
          </Button>
        </Stack>
      </Stack>
      <br />
      {localMode === "send" && <SendPanel />}
      <br />
      {localMode === "receive" && <AddressPanel />}
    </Box>
  );
};
