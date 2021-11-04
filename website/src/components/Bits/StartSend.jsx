import { useEffect, useState } from "react";
import { Box, Tooltip } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useMoralis } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const StartSend = (props) => {
  const { fromToken, toAddress, txAmount } = useActions();
  const { setDialog } = useExperts();
  const { Moralis } = useMoralis();
  const [options, setOptions] = useState({});
  const [tokenType, setTokenType] = useState("native");
  const [isTxLoading, setIsTxLoading] = useState(false);

  useEffect(() => {
    setTokenType(
      fromToken.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ? "native"
        : "erc20"
    );
    setOptions({
      type: tokenType,
      amount: Moralis.Units.ETH(Number(txAmount), fromToken.decimals),
      receiver: toAddress,
      contractAddress: fromToken.tokenAddress,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, toAddress, txAmount]);

  const pushIt = async (e) => {
    setIsTxLoading(true);
    setDialog("Sending Tx for a wallet signature...");
    Moralis.transfer(options)
      .then((results) => {
        setIsTxLoading(false);
        setDialog("Your signed transaction was sent to network!");
      })
      .catch((e) => setDialog("Oops! " + e.message));
  };

  return (
    <Box>
      <Tooltip title="Preview token transmission.">
        <span>
          <LoadingButton
            variant="contained"
            disabled={!txAmount || !toAddress}
            loading={isTxLoading}
            onClick={pushIt}
            sx={{ boxShadow: "var(--boxShadow)" }}
          >
            Preview Send Order
          </LoadingButton>
        </span>
      </Tooltip>
    </Box>
  );
};
