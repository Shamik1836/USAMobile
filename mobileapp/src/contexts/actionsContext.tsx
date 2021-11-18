import React, { useState, useContext } from 'react';
import { Token, FromToken, ToToken } from '../types';

interface ActionContextValue{
  fromToken: Partial<FromToken>;
  fromTokenAddress:string;
  fromTokenSymbol: string;
  toToken: Partial<ToToken>;
  toTokenAddress:string ;
  toTokenSymbol: string;
  txAmount: string;
  setFromToken: React.Dispatch<React.SetStateAction<Partial<FromToken>>>;
  setToToken: React.Dispatch<React.SetStateAction<Partial<ToToken>>>;
  setTxAmount: React.Dispatch<React.SetStateAction<string>>;
}

// @ts-ignore
const ActionsContext = React.createContext<Partial<ActionContextValue>>();

export const useActions = () => useContext(ActionsContext);

export const ActionsProvider = (props) => {
  const [fromToken, setFromToken] = useState<Partial<FromToken>>();
  const [toToken, setToToken] = useState<Partial<ToToken>>();
  const [txAmount, setTxAmount] = useState('');

  return (
    <ActionsContext.Provider
      value={{
        fromToken,
        fromTokenAddress: fromToken?.address,
        fromTokenSymbol: fromToken?.symbol,
        toToken,
        toTokenAddress: toToken?.address,
        toTokenSymbol: toToken?.symbol,
        txAmount,
        setFromToken,
        setToToken,
        setTxAmount
      }}
    >
      {props.children}
    </ActionsContext.Provider>
  );
};

export default ActionsContext;
