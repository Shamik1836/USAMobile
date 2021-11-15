import React, { useState, useContext } from 'react';

const NetworkContext = React.createContext();

const networks = {
  1: {
    name: 'eth',
    nativeToken: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  137: {
    name: 'polygon',
    nativeToken: {
      name: 'Matic Token',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
};

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = (props) => {
  const [networkId, setNetworkId] = useState(1);
  const [accounts, setAccounts] = useState([]);

  return (
    <NetworkContext.Provider
      value={{
        setNetworkId,
        networkId,
        networkName: networks[networkId]?.name,
        nativeToken: networks[networkId]?.nativeToken,
        isPolygon: networkId === 137,
        setAccounts,
        accounts,
      }}
    >
      {props.children}
    </NetworkContext.Provider>
  );
};

export default NetworkContext;
