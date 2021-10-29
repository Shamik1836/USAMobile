import React, { useState, useContext } from "react";

const ActionsContext = React.createContext();

export const useActions = () => useContext(ActionsContext);

export const ActionsProvider = (props) => {
  const [fromToken, setFromToken] = useState();
  const [toToken, setToToken] = useState();
  const [txAmount, setTxAmount] = useState("");

  return (
    <ActionsContext.Provider
      value={{
        setFromToken,
        fromToken,
        fromAddress: fromToken?.address,
        fromSymbol: fromToken?.symbol,
        setToToken,
        toToken,
        toAddress: toToken?.address,
        toSymbol: toToken?.symbol,
        setTxAmount,
        txAmount,
      }}
    >
      {props.children}
    </ActionsContext.Provider>
  );
};

export default ActionsContext;
