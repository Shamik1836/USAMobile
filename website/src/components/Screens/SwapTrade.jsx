import { useEffect } from "react";
import { Box } from '@mui/material';
import { useMoralis } from "react-moralis";


import { SwapPanel } from "../Blocks/SwapPanel";

import { useExperts } from "../../contexts/expertsContext";
import { useNetwork } from "../../contexts/networkContext";

import { Heading } from '../UW/Heading';


export const SwapTrade = () => {
  const { setActionMode, setDialog } = useExperts();
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
    setActionMode("swap");
    setDialog("Select a token to convert.");
  }, [setActionMode, setDialog]);


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
       setDialog(error.message);
     })
     .catch(error=>{
       console.log('ChainIdCatch:', error);
       setDialog(error.message);
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
    <Box sx={{textAlign: 'center', mt:1}}>
      <Heading variant="h4">
        Swap/Trade
      </Heading>
      <br />
      <SwapPanel />
    </Box>
    
  );
};
