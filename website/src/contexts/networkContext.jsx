import React, { useState, useContext } from "react";

const NetworkContext = React.createContext();

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = (props) => {
  const [networkId, setNetworkId] = useState(137);
  const [networkName, setNetworkName] = useState("matic");
  const [accounts, setAccounts] = useState([]);

  return (
    <NetworkContext.Provider
      value={{
        networkId,
        setNetworkId,
        networkName,
        setNetworkName,
        accounts,
        setAccounts
      }}
    >
      {props.children}
    </NetworkContext.Provider>
  );
};

export default NetworkContext;
