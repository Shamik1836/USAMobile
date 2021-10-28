import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import { useNetwork } from "../contexts/networkContext";

const serverURL = "https://deep-index.moralis.io/api/v2/";
const endPoint = "/erc20/transfers";
const MoralisAPIKey =
  "7YWJtHybS03C0z09QQjND12bIX7d9uR1n3DYApZ1PXVTYprU3MKrTXhLsQ0rNfAK";
const emptyList = [];

export const useTokenTransfers = (props) => {
  const { isAuthenticated, user, web3, Moralis } = useMoralis();
  const [Txs, setTxs] = useState(emptyList);
  const [isLoading, setIsLoading] = useState(false);
  const { networkName } = useNetwork();

  useEffect(() => {
    if (isAuthenticated) {
      const currentUser = Moralis.User.current();
      const address = currentUser?.attributes.ethAddress;

      Moralis.Web3API.account
        .getTokenTransfers({ chain: props.chain, address })
        .then(response => {
          let newTxs = response.result.map((Tx) => {
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
          setTxs(newTxs);
          setIsLoading(false);
        })
    } else {
      setTxs(emptyList);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, props.chain]);

  console.debug("Returning transactions: ", Txs);
  console.groupEnd();

  return { Txs, isLoading };
};
