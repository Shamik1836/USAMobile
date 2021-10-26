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
  const { Moralis } = useMoralis();
  const { darkBoxShadow } = useGradient();

  const sendStart = async () => {
    const options = {
      type: "erc20",
      amount: Moralis.Units.Token(txAmount, "18"),
      receiver: toAddress,
      contractAddress: fromAddress
    }
    setLoading(true)
    let result = await Moralis.transfer(options);
    setLoading(false)
  }

  return (
    <Box>
        <Tooltip title="Preview token transmission.">
          <span>
            <LoadingButton
              variant="contained"
              disabled={!txAmount || !toAddress}
              loading={loading}
              onClick={sendStart}
              sx={{ boxShadow: darkBoxShadow }}
            >
              Preview Send Order
            </LoadingButton>
            
          </span>
        </Tooltip>
    </Box>
  );
};