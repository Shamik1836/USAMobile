import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';

import { useNetwork } from '../contexts/networkContext';

export const use1InchTokenList = () => {
  const { Moralis } = useMoralis();
  const { networkAlias } = useNetwork();
  const [tokenList, setTokenList] = useState([]);

  useEffect(() => {
    Moralis.Plugins.oneInch
      .getSupportedTokens({
        chain: networkAlias, // The blockchain you want to use (eth/bsc/polygon)
      })
      .then((data) => {
        const tokens = Object.values(data.tokens);
        setTokenList(tokens);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [Moralis, networkAlias]);

  return tokenList;
};
