import { useState, useEffect } from 'react';
import { useMoralis } from "react-moralis";

import { useNetwork } from "../contexts/networkContext";
import { useExperts } from "../contexts/expertsContext";


export const usePolygonNetwork = () => {
  const [isPolygon, setIsPolygon] = useState(false);
  const { Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  const { setNetworkId } = useNetwork();
  const { setDialog } = useExperts();

  useEffect(() => {

    const getSelectedNetwork = () => {
      Moralis.getChainId()
        .then((chainId) => {
          setNetworkId(chainId);
          if (chainId !== 137) {
            switchNetworkToPolygon(137);
          } else {
            setIsPolygon(true);
          }
        }, (error) => {
          console.log('ChainIdError:', error);
          setDialog(error.message);
          setIsPolygon(false);
        })
        .catch(error => {
          console.log('ChainIdCatch:', error);
          setDialog(error.message);
          setIsPolygon(false);
        })
    }

    const switchNetworkToPolygon = (chainId) => {
      Moralis.switchNetwork(chainId)
        .then((success) => {
          console.log('Success:', success);
          setIsPolygon(true);
          setNetworkId(chainId);

        }, (error) => {
          console.log('SwitchError:', error);
          setIsPolygon(false);
          setDialog(error.message);
        })
        .catch((error) => {
          console.log('SwitchCatch:', error);
          setIsPolygon(false);
          setDialog(error.message);
        })
    }
    if (!isWeb3Enabled) {
      enableWeb3();
    }
    if (isWeb3Enabled) {
      getSelectedNetwork();
    }
  }, [isWeb3Enabled, enableWeb3, Moralis, setNetworkId, setDialog]);


  return { isPolygon };
};

