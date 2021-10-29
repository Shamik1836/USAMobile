import { useEffect, useState } from "react";
import { useNetwork } from "../contexts/networkContext";

const network_tokens = {
  1: [
    "ETH",
    "WETH",
    "1INCH",
    "DAI",
    "USDC",
    "USDT",
    "WBTC",
    "stETH",
    "USDP",
    "TUSD",
    "BNT",
    "BAL",
    "sUSD",
  ],
  137: [
    "QUICK",
    "SDT",
    "MUST",
    "USDC",
    "WETH",
    "WMATIC",
    "MATIC",
    "USDT",
    "DAI",
    "WBTC",
  ],
};

export const use1InchTokenList = () => {
  const [tokenList, setTokenList] = useState([]);
  const [tokens, setTokens] = useState([]);
  const { networkId } = useNetwork();

  useEffect(() => {
    fetch(`https://api.1inch.exchange/v3.0/${networkId}/tokens`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((oneInchData) => {
        const tokens = Object.values(oneInchData.tokens);
        setTokenList(tokens);
        setTokens(
          network_tokens[networkId].map((symbol) =>
            tokens.find((item) => item.symbol === symbol)
          )
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, [networkId]);

  return { tokenList, tokens };
};
