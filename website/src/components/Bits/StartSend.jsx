import { useEffect } from 'react';
import { Box, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMoralis } from 'react-moralis';
import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import useTransferAction from '../../actions/useTransferAction';

export const StartSend = () => {
  const { Moralis } = useMoralis();
  const { setDialog } = useExperts();
  const { fromToken, fromAddress, toAddress, txAmount, fromTokenType } =
    useActions();
  const { fetch, isFetching, data, error } = useTransferAction({
    type: fromTokenType,
    amount:
      fromTokenType === 'native'
        ? Moralis.Units.ETH(Number(txAmount), fromToken?.decimals)
        : Moralis.Units.Token(txAmount, fromToken?.decimals),
    receiver: toAddress,
    contractAddress: fromAddress,
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
            disabled={!txAmount || !toAddress}
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
