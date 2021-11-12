import { useEffect } from 'react';
import { Box, FormControl, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import { useQuote } from '../../contexts/quoteContext';
import { useColorMode } from '../../contexts/colorModeContext';
import { useNetwork } from '../../contexts/networkContext';
import useQuoteAction from '../../actions/useQuoteAction';

export const RequestQuote = () => {
  const { networkName } = useNetwork();
  const {
    fromTokenSymbol,
    fromTokenAddress,
    toTokenSymbol,
    toTokenAddress,
    txAmount,
  } = useActions();
  const { setQuote } = useQuote();
  const { setDialog } = useExperts();
  const { colorMode } = useColorMode();
  const { fetch, isFetching, data, error } = useQuoteAction({
    chain: networkName,
    fromTokenAddress,
    toTokenAddress,
    amount: txAmount,
  });

  useEffect(() => {
    if (isFetching) {
      setDialog(
        'Estimating costs to swap ' +
          fromTokenSymbol +
          ' to ' +
          toTokenSymbol +
          ' ... '
      );
    }
  }, [isFetching, fromTokenSymbol, toTokenSymbol, setDialog]);

  useEffect(() => {
    if (data) {
      setQuote(data);
      setDialog(
        "Push 'Do it!' to execute swap.  Or adjust inputs to update quote."
      );
    }
  }, [data, setQuote, setDialog]);

  useEffect(() => {
    if (error) {
      setDialog('Something went wrong: ' + error.message);
    }
  }, [error, setDialog]);

  return (
    <Box>
      <FormControl id="sendstart" fullWidth>
        <Tooltip title="Preview token transmission.">
          <span>
            <LoadingButton
              disabled={!txAmount || !toTokenSymbol}
              variant={colorMode === 'light' ? 'outlined' : 'contained'}
              sx={{ boxShadow: 'var(--boxShadow)' }}
              loading={isFetching}
              onClick={fetch}
            >
              Get Swap Quote
            </LoadingButton>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};
