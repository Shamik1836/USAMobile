import { useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { useQuote } from '../../contexts/quoteContext';
import { useExperts } from '../../contexts/expertsContext';
import { useActions } from '../../contexts/actionsContext';
import { useNetwork } from '../../contexts/networkContext';
import useSwapAction from '../../actions/useSwapAction';

export const DoItButton = () => {
  const { user } = useMoralis();
  const { networkAlias } = useNetwork();
  const { setQuote } = useQuote();
  const { fromToken, fromAddress, toAddress, txAmount } = useActions();
  const { setDialog } = useExperts();
  const { fetch, isFetching, isApproved, data, error } = useSwapAction({
    chain: networkAlias,
    fromTokenAddress: fromAddress,
    toTokenAddress: toAddress,
    amount: txAmount,
    fromAddress: user.attributes.ethAddress,
    slippage: 3,
  });

  useEffect(() => {
    if (isFetching) {
      setDialog(
        'Retrieving pre-approval codes to swap ' + txAmount + ' of your ',
        fromToken.symbol.toUpperCase()
      );
    }
  }, [isFetching, fromToken, txAmount, setDialog]);

  useEffect(() => {
    if (isApproved) {
      setDialog('Approval success.');
    }
  }, [isApproved, setDialog]);

  useEffect(() => {
    if (data) {
      setQuote();
      setDialog('Swap success.');
    }
  }, [data, setQuote, setDialog]);

  useEffect(() => {
    if (error) {
      setDialog('Something went wrong: ' + error.message);
    }
  }, [error, setDialog]);

  return (
    <Tooltip title="Submit swap order.">
      <LoadingButton
        className="ExpertButton"
        variant="contained"
        sx={{ boxShadow: 'var(--boxShadow)', mr: 2 }}
        onClick={fetch}
        loading={isFetching}
      >
        Do it.
      </LoadingButton>
    </Tooltip>
  );
};
