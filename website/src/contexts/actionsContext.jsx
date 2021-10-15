import React, { useState, useContext } from "react";

const ActionsContext = React.createContext();

export const useActions = () => useContext(ActionsContext);

export const ActionsProvider = (props) => {
  const [fromSymbol, setFromSymbol] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [fromENSType, setFromENSType] = useState("");
  const [toSymbol, setToSymbol] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [toToken, setToToken] = useState({});
  const [toENSType, setToENSType] = useState("");
  const [txAmount, setTxAmount] = useState("");

  return (
    <ActionsContext.Provider
      value={{
        fromSymbol,
        setFromSymbol,
        fromAddress,
        setFromAddress,
        fromENSType,
        setFromENSType,
        toSymbol,
        setToSymbol,
        toAddress,
        setToAddress,
        toToken,
        setToToken,
        toENSType,
        setToENSType,
        txAmount,
        setTxAmount,
      }}
    >
      {props.children}
    </ActionsContext.Provider>
  );
};

export default ActionsContext;
