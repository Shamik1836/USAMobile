import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';

import { useNetwork } from '../contexts/networkContext';

export const use1InchTokenList = () => {
  const { Moralis } = useMoralis();
  const { networkName } = useNetwork();
  const [tokenList, setTokenList] = useState([]);

  useEffect(() => {
    Moralis.Plugins.oneInch
      .getSupportedTokens({
        chain: networkName, // The blockchain you want to use (eth/bsc/polygon)
      })
      .then((data) => {
        const tokens = Object.values(data.tokens);
        setTokenList(tokens);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [Moralis, networkName]);

  return tokenList;
};
