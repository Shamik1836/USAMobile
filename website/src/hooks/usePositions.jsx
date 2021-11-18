import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';
import { useNetwork } from '../contexts/networkContext';
import geckoCoinIds from '../data/geckoCoinIds.json';

const emptyList = [];
const geckoHead =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=';

export const usePositions = () => {
  const { isInitialized, isAuthenticated, Moralis } = useMoralis();
  const { networkName, nativeToken } = useNetwork();
  const [positions, setPositions] = useState(emptyList);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(1);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      const options = { chain: networkName };
      Promise.all([
        Moralis.Web3API.account.getNativeBalance(options),
        Moralis.Web3API.account.getTokenBalances(options),
      ])
        .then(([native, erc20]) => {
          const allPositions = [
            {
              ...nativeToken,
              ...native,
            },
            ...erc20,
          ];
          const ids = allPositions
            .map((token) => geckoCoinIds[token.symbol.toLowerCase()])
            .filter((id) => Boolean(id))
            .join(',');

          fetch(`${geckoHead}?vs_currency=usd&ids=${ids}`)
            .then((response) => response.json())
            .then((data) => {
              const objects = {};
              data.forEach((d) => (objects[d.symbol.toUpperCase()] = d));

              let runningTotal = 0;
              const newList = allPositions
                .map((token) => {
                  const { symbol, balance, decimals, name } = token;
                  const {
                    id,
                    image,
                    current_price: price,
                  } = objects[symbol] || {};
                  const tokens = balance ? balance / 10 ** decimals : 0;
                  const value = price ? tokens * price : 0;
                  runningTotal += value;
                  return {
                    ...token,
                    name: name.replace('(PoS)', '').trim(),
                    id,
                    image,
                    price,
                    tokens,
                    value,
                  };
                })
                .filter((token) => token.value);
              setPositions(newList);
              setTotalValue(runningTotal);
              setIsLoading(0);
            });
        })
        .catch(() => {
          setPositions(emptyList);
          setIsLoading(0);
        });
    } else {
      setPositions(emptyList);
      setIsLoading(0);
    }
  }, [Moralis, isAuthenticated, isInitialized, networkName, nativeToken]);

  return { positions, isLoading, totalValue };
};
