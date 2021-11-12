import { useState, useCallback } from 'react';
import { useMoralis } from 'react-moralis';

import useUpdaters from './_useUpdaters';

const useTransferAction = ({ type, amount, receiver, contractAddress }) => {
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
      const data = await Moralis.transfer({
        type,
        amount,
        receiver,
        contractAddress,
      });

      updaters.current?.setData(data);
    } catch (e) {
      updaters.current?.setError(e);
    }

    updaters.current?.setIsFetching(false);
  }, [type, amount, receiver, contractAddress, updaters, Moralis]);

  return { fetch, isFetching, data, error };
};

export default useTransferAction;
