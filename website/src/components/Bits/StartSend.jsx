import { useEffect } from 'react';
import { Box, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import useTransferAction from '../../actions/useTransferAction';

export const StartSend = () => {
  const { setDialog } = useExperts();
  const { fromToken, fromTokenAddress, toTokenAddress, txAmount } =
    useActions();
  const { fetch, isFetching, data, error } = useTransferAction({
    amount: txAmount,
    decimals: fromToken?.decimals,
    receiver: toTokenAddress,
    contractAddress: fromTokenAddress,
  });

  useEffect(() => {
    if (isFetching) {
      setDialog('Sending Tx for a wallet signature...');
    }
  }, [isFetching, setDialog]);

  useEffect(() => {
    if (data) {
      setDialog('Your signed transaction was sent to network!');
    }
  }, [data, setDialog]);

  useEffect(() => {
    if (error) {
      setDialog('Something went wrong: ' + error.message);
    }
  }, [error, setDialog]);

  return (
    <Box>
      <Tooltip title="Preview token transmission.">
        <span>
          <LoadingButton
            variant="contained"
            disabled={!txAmount || !toTokenAddress}
            loading={isFetching}
            onClick={fetch}
            sx={{ boxShadow: 'var(--boxShadow)' }}
          >
            Preview Send Order
          </LoadingButton>
        </span>
      </Tooltip>
    </Box>
  );
};
