import { useEffect, useState } from 'react';
import { useMoralis } from 'react-moralis';

const emptyList = [];

export const useTokenTransfers = (props) => {
  const { isAuthenticated, user, Moralis } = useMoralis();
  const address = user.attributes['ethAddress'];
  const [ERC20Txs, setERC20Txs] = useState(emptyList);
  const [ERC20IsLoading, setERC20IsLoading] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      Moralis.Web3API.account
        .getTokenTransfers({ chain: props.chain, address })
        .then((response:any) => {
          let newTxs = response.result
            .filter((t) => t.address === props.tokenAddress)
            .map((Tx) => {
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
                  console.debug('Failed address: ', address);
                  console.debug('Failed Tx.from_address:', Tx.from_address);
                  console.debug('Failed Tx.to_address:', Tx.to_address);
                  output.counterparty = null;
                  output.amount = null;
                  break;
              }
              return output;
            });
          setERC20Txs(newTxs);
          setERC20IsLoading(false);
        });
    } else {
      setERC20Txs(emptyList);
      setERC20IsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, props.chain]);

  return { ERC20Txs, ERC20IsLoading };
};
