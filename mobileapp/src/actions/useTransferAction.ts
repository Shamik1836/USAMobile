import { useState, useCallback } from 'react';
import { useMoralis } from 'react-moralis';

import useUpdaters from './_useUpdaters';

const useTransferAction = ({ amount, decimals, receiver, contractAddress }) => {
  const { Moralis } = useMoralis();
  const [isFetching, setIsFetching] = useState(false);
  const [data, setData] = useState();
  const [error, setError] = useState();
  const updaters = useUpdaters({
    setIsFetching,
    setData,
    setError,
  });

  const fetch = useCallback(async () => {
    updaters.current?.setIsFetching(true);
    updaters.current?.setData();
    updaters.current?.setError();

    try {
      const options = { receiver };
      if (contractAddress) {
        options.type = 'erc20';
        options.amount = Moralis.Units.Token(amount, decimals);
        options.contractAddress = contractAddress;
      } else {
        options.type = 'native';
        options.amount = Moralis.Units.ETH(amount, decimals);
      }
      const data = await Moralis.transfer(options);

      updaters.current?.setData(data);
    } catch (e) {
      updaters.current?.setError(e);
    }

    updaters.current?.setIsFetching(false);
  }, [amount, decimals, receiver, contractAddress, updaters, Moralis]);

  return { fetch, isFetching, data, error };
};

export default useTransferAction;
