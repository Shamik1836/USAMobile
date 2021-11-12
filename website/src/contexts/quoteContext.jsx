import React, { useState, useContext } from 'react';

const QuoteContext = React.createContext();

export const useQuote = () => useContext(QuoteContext);

export const QuoteProvider = (props) => {
  const [quote, setQuote] = useState();

  return (
    <QuoteContext.Provider
      value={{
        quoteValid: !!quote,
        fromToken: quote?.fromToken,
        fromTokenAmount: quote?.fromTokenAmount,
        protocols: quote ? quote.protocols[0] : null,
        toToken: quote?.toToken,
        toTokenAmount: quote?.toTokenAmount,
        estimatedGas: quote?.estimatedGas,
        setQuote,
      }}
    >
      {props.children}
    </QuoteContext.Provider>
  );
};

export default QuoteContext;
