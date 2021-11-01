import { useEffect, useState } from "react";
import { useNetwork } from "../contexts/networkContext";

export const use1InchTokenList = () => {
  const [tokenList, setTokenList] = useState([]);
  const { networkId } = useNetwork();

  useEffect(() => {
    fetch(`https://api.1inch.exchange/v3.0/${networkId}/tokens`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((oneInchData) => {
        const tokens = Object.values(oneInchData.tokens);
        setTokenList(tokens);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [networkId]);

  return tokenList;
};
