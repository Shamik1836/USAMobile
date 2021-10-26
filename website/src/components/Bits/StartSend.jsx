import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Box,Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';


import { useWeb3Transfer } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";
import { useGradient } from "../../contexts/gradientsContext";

export const StartSend = () => {

  const [loading, setLoading] = useState(false)
  const { fromAddress, toAddress, txAmount } = useActions();
  const { darkBoxShadow } = useGradient();

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
              sx={{ boxShadow: darkBoxShadow }}
            >
              Preview Send Order
            </LoadingButton>
            
          </span>
        </Tooltip>
    </Box>
  );
};