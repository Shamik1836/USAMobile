import React, { useState, useContext } from 'react';

const NetworkContext = React.createContext();

const networks = {
  1: {
    name: 'eth',
    chainID: 1,
  },
  137: {
    name: 'polygon',
    chainID: 137,
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
