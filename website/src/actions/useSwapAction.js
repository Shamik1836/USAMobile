import { useState, useCallback } from 'react';
import { useMoralis } from 'react-moralis';

import useUpdaters from './_useUpdaters';

const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const useSwapAction = ({
  chain,
  fromTokenAddress,
  toTokenAddress,
  amount,
  fromAddress,
  slippage,
}) => {
  const { Moralis } = useMoralis();
  const [isFetching, setIsFetching] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [data, setData] = useState();
  const [error, setError] = useState();
  const updaters = useUpdaters({
    setIsFetching,
    setData,
    setError,
    setIsApproved,
  });

  const fetch = useCallback(async () => {
    updaters.current?.setIsFetching(true);
    updaters.current?.setIsApproved(false);
    updaters.current?.setData();
    updaters.current?.setError();

    try {
      await Moralis.Plugins.oneInch.approve({
        chain,
        tokenAddress: fromTokenAddress || NATIVE_ADDRESS,
        fromAddress,
      });

      updaters.current?.setIsApproved(true);

      const data = await Moralis.Plugins.oneInch.swap({
        chain,
        fromTokenAddress: fromTokenAddress || NATIVE_ADDRESS,
        toTokenAddress: toTokenAddress || NATIVE_ADDRESS,
        amount,
        fromAddress,
        slippage,
      });

      updaters.current?.setData(data);
    } catch (e) {
      updaters.current?.setError(e);
    }

    updaters.current?.setIsFetching(false);
  }, [
    chain,
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromAddress,
    slippage,
    updaters,
    Moralis,
  ]);

  return { fetch, isFetching, isApproved, data, error };
};

export default useSwapAction;
