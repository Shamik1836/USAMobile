import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';
import { useNetwork } from '../contexts/networkContext';
import coinGeckoList from '../data/coinGeckoTokenList.json';

const emptyList = [];
const geckoHead =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=';
const geckoTail = '&order=market_cap_desc&per_page=100&page=1&sparkline=false';

export const usePositions = () => {
  const { isInitialized, isAuthenticated, Moralis } = useMoralis();
  const { networkName } = useNetwork();
  const [positions, setPositions] = useState(emptyList);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(1);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) {
      Moralis.Web3.getAllERC20({ chain: networkName })
        .then((allPositions) => {
          const ids = allPositions
            .map((token) => coinGeckoList[token.symbol.toLowerCase()]?.id)
            .filter((id) => Boolean(id))
            .join(',');

          fetch(`${geckoHead}?vs_currency=usd&ids=${ids}` + geckoTail)
            .then((response) => response.json())
            .then((data) => {
              const objects = {};
              data.forEach((d) => (objects[d.symbol.toUpperCase()] = d));

              let runningTotal = 0;
              const newList = allPositions.map((token) => {
                const { symbol, balance, decimals } = token;
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
                  id,
                  image,
                  price,
                  tokens,
                  value,
                };
              });
              setPositions(newList);
              setTotalValue(runningTotal);
              setIsLoading(0);
            });
        })
        .catch((e) => {
          setPositions(emptyList);
          setIsLoading(0);
        });
    } else {
      setPositions(emptyList);
      setIsLoading(0);
    }
  }, [Moralis, isAuthenticated, isInitialized, networkName]);

  return { positions, isLoading, totalValue };
};
