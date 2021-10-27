import { Box,Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';


import { useWeb3Transfer } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";

export const StartSend = () => {

  const { fromAddress, toAddress, txAmount } = useActions();

  const { fetch, isFetching } = useWeb3Transfer({
    amount: txAmount,
    receiver: toAddress,
    type: "erc20",
    contractAddress: fromAddress,
  });

  return (
    <Box>
        <Tooltip title="Preview token transmission.">
          <span>
            <LoadingButton
              variant="contained"
              disabled={!txAmount || !toAddress}
              loading={isFetching}
              onClick={fetch}
              sx={{ boxShadow: "var(--boxShadow)" }}
            >
              Preview Send Order
            </LoadingButton>
            
          </span>
        </Tooltip>
    </Box>
  );
};