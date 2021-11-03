import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";

const emptyList = [
  { timestamp: null, counterparty: "No transactions found.", amount: null },
];

export const useTransactions = (props) => {
  const { isAuthenticated, Moralis, user } = useMoralis();
  const address = user.attributes["ethAddress"];
  const [NativeTxs, setNativeTxs] = useState(emptyList);
  const [NativeIsLoading, setNativeIsLoading] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      Moralis.Web3API.account
        .getTransactions({ chain: props.chain, address })
        .then((userTrans) => {
          let newTxs = userTrans.result.map((Tx) => {
            const output = { ...Tx };
            switch (address) {
              case Tx.from_address:
                output.counterparty = Tx.to_address;
                output.amount = -1 * parseFloat(Tx.value);
                break;
              case Tx.to_address:
                output.counterparty = Tx.from_address;
                output.amount = 1 * parseFloat(Tx.value);
                break;
              case undefined:
                output.counterparty = undefined;
                output.amount = undefined;
                break;
              default:
                console.debug("Failed address: ", address);
                console.debug("Failed Tx.from_address:", Tx.from_address);
                console.debug("Failed Tx.to_address:", Tx.to_address);
                output.counterparty = null;
                output.amount = null;
                break;
            }
            return output;
          });
          setNativeTxs(newTxs);
          setNativeIsLoading(0);
        });
    } else {
      setNativeTxs(emptyList);
      setNativeIsLoading(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Moralis.Web3, isAuthenticated]);

  return { NativeTxs, NativeIsLoading };
};
