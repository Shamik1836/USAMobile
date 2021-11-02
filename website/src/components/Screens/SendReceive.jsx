import { useState, useEffect } from "react";
import { Box, Button, Stack } from '@mui/material';

import { SendPanel } from "../Blocks/SendPanel";
import { AddressPanel } from "../Blocks/AddressPanel";
import { Heading } from '../UW/Heading';
import { useMoralis } from "react-moralis";


import { useExperts } from "../../contexts/expertsContext";
import { useNetwork } from "../../contexts/networkContext";


export const SendReceive = () => {
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState("none");
  const { Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  const { networkId, setNetworkId } = useNetwork();

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
    if (isWeb3Enabled) {
      getSelectedNetwork();  
    }   
  }, [isWeb3Enabled, enableWeb3]);

  useEffect(() => {
    setActionMode("send");
    setDialog("Would you like to send or receive cryptocurrency?");

  }, [setActionMode, setDialog]);


  const handleSendMode = async () => {

    if (networkId !== 137) {
      setDialog('Switch network to Polygon');
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

  const getSelectedNetwork = async() => {
     Moralis.getChainId()
     .then((chainId)=>{
       console.log('ChainId:', chainId);
       setNetworkId(chainId);

       // If we want to switch network here on Send/Receive.
       if(chainId!=137){
         switchNetworkToPolygon(137);
       }
     },(error)=>{
       console.log('ChainIdError:', error);
     })
     .catch(error=>{
       console.log('ChainIdCatch:', error);
     })
  }

  const switchNetworkToPolygon = (chainId) =>{
    Moralis.switchNetwork(chainId)
    .then((success)=>{
      console.log('Success:', success);
    },(error)=>{
      console.log('SwitchError:', error);
      setDialog(error.message);
    })
    .catch((error)=>{
      console.log('SwitchCatch:', error);
      setDialog(error.message);
    })
  }

  return (
    <Box sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
      <Heading variant="h4">Transfer Cryptocurrency</Heading>
      <br />
      <Stack sx={{ alignItems: 'center' }}>
        <Stack direction="row">
          <Button onClick={handleSendMode} sx={{ mr: 1, boxShadow: "var(--boxShadow)" }}>
            Send
          </Button>
          <Button onClick={handleReceiveMode} sx={{ boxShadow: "var(--boxShadow)" }}>
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
