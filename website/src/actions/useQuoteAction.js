import { useState, useCallback } from 'react';
import { useMoralis } from 'react-moralis';

import useUpdaters from './_useUpdaters';

const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const useQuoteAction = ({
  chain,
  fromTokenAddress,
  toTokenAddress,
  amount,
}) => {
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
      const data = await Moralis.Plugins.oneInch.quote({
        chain,
        fromTokenAddress: fromTokenAddress || NATIVE_ADDRESS,
        toTokenAddress: toTokenAddress || NATIVE_ADDRESS,
        amount,
      });

      updaters.current?.setData(data);
    } catch (e) {
      updaters.current?.setError(e);
    }

    updaters.current?.setIsFetching(false);
  }, [chain, fromTokenAddress, toTokenAddress, amount, updaters, Moralis]);

  return { fetch, isFetching, data, error };
};

export default useQuoteAction;
