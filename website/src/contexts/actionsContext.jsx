import React, { useState, useContext } from 'react';

const ActionsContext = React.createContext();

export const useActions = () => useContext(ActionsContext);

export const ActionsProvider = (props) => {
  const [fromToken, setFromToken] = useState();
  const [toToken, setToToken] = useState();
  const [txAmount, setTxAmount] = useState('');

  return (
    <ActionsContext.Provider
      value={{
        setFromToken,
        fromToken,
        fromAddress: fromToken?.tokenAddress,
        fromSymbol: fromToken?.symbol,
        fromTokenType:
          fromToken?.tokenAddress ===
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
            ? 'native'
            : 'erc20',
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
