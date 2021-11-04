import { useState, useEffect } from "react";
import { Box, Button, Stack } from "@mui/material";

import { SendPanel } from "../Blocks/SendPanel";
import { AddressPanel } from "../Blocks/AddressPanel";
import { Heading } from "../UW/Heading";

import { usePolygonNetwork } from "../../hooks/usePolygonNetwork";

import { useExperts } from "../../contexts/expertsContext";

export const SendReceive = () => {
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState("none");
  const { isPolygon } = usePolygonNetwork();

  useEffect(() => {
    setActionMode("send");
    setDialog("Would you like to send or receive cryptocurrency?");
  }, [setActionMode, setDialog]);

  useEffect(() => {
    if (!isPolygon) {
      setDialog("Switch to Polygon.");
    } else {
      setDialog("Would you like to send or receive cryptocurrency?");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolygon, setDialog]);

  const handleSendMode = async () => {
    if (!isPolygon) {
      setDialog("Switch network to Polygon");
      return;
    }

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
    <Box sx={{ textAlign: "center", mt: 1, mb: 3 }}>
      <Heading variant="h4">Transfer Cryptocurrency</Heading>
      <br />
      <Stack sx={{ alignItems: "center" }}>
        <Stack direction="row">
          <Button
            onClick={handleSendMode}
            sx={{ mr: 1, boxShadow: "var(--boxShadow)" }}
          >
            Send
          </Button>
          <Button
            onClick={handleReceiveMode}
            sx={{ boxShadow: "var(--boxShadow)" }}
          >
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
