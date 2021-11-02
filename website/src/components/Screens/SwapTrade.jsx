import { useEffect } from "react";
import { Box } from '@mui/material';

import { SwapPanel } from "../Blocks/SwapPanel";
import { Heading } from '../UW/Heading';

import { usePolygonNetwork } from '../../hooks/usePolygonNetwork';

import { useExperts } from "../../contexts/expertsContext";

// import { useMoralis } from "react-moralis";
// import { useNetwork } from "../../contexts/networkContext";


export const SwapTrade = () => {
  const { setActionMode, setDialog } = useExperts();
  const { isPolygon } = usePolygonNetwork();

  // const { Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  // const { networkId, setNetworkId } = useNetwork();
  // useEffect(() => {
  //   if (!isWeb3Enabled) {
  //     enableWeb3();
  //   }
  //   if (isWeb3Enabled) {
  //     getSelectedNetwork();  
  //   }   
  // }, [isWeb3Enabled, enableWeb3]);

  // const getSelectedNetwork = async() => {
  //    Moralis.getChainId()
  //    .then((chainId)=>{
  //      console.log('ChainId:', chainId);
  //      setNetworkId(chainId);

  //      // If we want to switch network here on Send/Receive.
  //      if(chainId!=137){
  //        switchNetworkToPolygon(137);
  //      }
  //    },(error)=>{
  //      console.log('ChainIdError:', error);
  //      setDialog(error.message);
  //    })
  //    .catch(error=>{
  //      console.log('ChainIdCatch:', error);
  //      setDialog(error.message);
  //    })
  // }

  // const switchNetworkToPolygon = (chainId) =>{
  //   Moralis.switchNetwork(chainId)
  //   .then((success)=>{
  //     console.log('Success:', success);
  //   },(error)=>{
  //     console.log('SwitchError:', error);
  //     setDialog(error.message);
  //   })
  //   .catch((error)=>{
  //     console.log('SwitchCatch:', error);
  //     setDialog(error.message);
  //   })
  // }

  useEffect(() => {
    if(!isPolygon){
      setDialog('Switch to Polygon.')
    }
  }, [isPolygon]);


  useEffect(() => {
    setActionMode("swap");
    setDialog("Select a token to convert.");
  }, [setActionMode, setDialog]);

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
