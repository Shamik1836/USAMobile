import { useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import MetaMaskOnboarding from '@metamask/onboarding';

import { useNetwork } from '../contexts/networkContext';
import { useExperts } from '../contexts/expertsContext';

const CHAIN_ID = 137;
const CHAIN_NAME = 'Polygon Mainnet';
const CURRENCY_NAME = 'MATIC';
const CURRENCY_SYMBOL = 'MATIC';
const RPC_URL = 'https://polygon-rpc.com/';
const BLOCK_EXPLORER_URL = 'https://polygonscan.com/';

export const usePolygonNetwork = () => {
  const { Moralis, enableWeb3, isWeb3Enabled } = useMoralis();
  const { isAuthenticated, setNetworkId } = useNetwork();
  const { setDialog } = useExperts();

  useEffect(() => {
    if (isAuthenticated) {
      if (!isWeb3Enabled) {
        enableWeb3();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeb3Enabled, enableWeb3]);

  const getSelectedNetwork = async () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      Moralis.getChainId()
        .then(
          (chainId) => {
            setNetworkId(chainId);
          },
          (error) => {
            console.log('ChainIdError:', error);
            setDialog(error.message);
            setNetworkId(1);
          }
        )
        .catch((error) => {
          console.log('ChainIdCatch:', error);
          setDialog(error.message);
          setNetworkId(1);
        });
    } else {
      setNetworkId(1);
      setDialog('Install MetaMask First.');
    }
  };
  const switchNetworkToPolygon = () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      Moralis.switchNetwork(CHAIN_ID)
        .then(
          (success) => {
            console.log('Success:', success);
            setNetworkId(CHAIN_ID);
            setDialog('Polygon Chain switched successfully.');
          },
          (switchError) => {
            console.log('SwitchError:', switchError);
            setNetworkId(1);
            setDialog(switchError.message);
            if (switchError.code === 4902) {
              // console.log('We will call Add Network here.');
              addPolygonNetwork();
            } else {
              const message = switchError.message ?? '';
              const testString = 'Unrecognized chain ID';
              if (message.toLowerCase().includes(testString.toLowerCase())) {
                // console.log('We will call Add Network here.');
                addPolygonNetwork();
              }
            }
          }
        )
        .catch((error) => {
          console.log('SwitchCatch:', error);
          setNetworkId(1);
          setDialog(error.message);
        });
    } else {
      setNetworkId(1);
      setDialog('Install MetaMask First.');
    }
  };

  const addPolygonNetwork = () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      Moralis.addNetwork(
        CHAIN_ID,
        CHAIN_NAME,
        CURRENCY_NAME,
        CURRENCY_SYMBOL,
        RPC_URL,
        BLOCK_EXPLORER_URL
      )
        .then(
          (success) => {
            if (typeof success == 'undefined') {
              setDialog('Polygon Network added to Metamask successfully.');
              setNetworkId(CHAIN_ID);
            }
          },
          (error) => {
            setNetworkId(1);
            setDialog('There is an error in adding Network, Please try again.');
          }
        )
        .catch((error) => {
          setNetworkId(1);
          setDialog('There is an error in adding Network, Please try again.');
        });
    } else {
      setNetworkId(1);
      setDialog('Install MetaMask First.');
    }
  };

  return { getSelectedNetwork, switchNetworkToPolygon, addPolygonNetwork };
};
