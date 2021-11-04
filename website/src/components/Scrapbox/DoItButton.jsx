import { useState } from "react";
import { useMoralis } from "react-moralis";
import { Tooltip } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";

import { useQuote } from "../../contexts/quoteContext";
import { useExperts } from "../../contexts/expertsContext";
import { useActions } from "../../contexts/actionsContext";
import { useNetwork } from "../../contexts/networkContext";

export const DoItButton = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const { networkId } = useNetwork();
  const { setQuoteValid } = useQuote();
  const { fromToken, toToken, txAmount } = useActions();
  const { Moralis, user } = useMoralis();
  const { setDialog } = useExperts();

  const sendTransaction = (config) => {
    setDialog(
      "Transmitting pre-approval code to the send token.  " +
        "Please sign this transaction in your wallet."
    );
    return new Promise((resolve, reject) => {
      Moralis.Web3.enable().then((web3) => {
        web3.eth.sendTransaction(config, (err, hash) => {
          if (err) {
            setDialog("Swap was not pre-approved.");
            reject(err);
          } else {
            setDialog("Swap is now pre-approved.");
            resolve(hash);
          }
        });
      });
    });
  };

  const handlePress = async () => {
    setIsLoading(true);

    try {
      setDialog(
        "Retrieving pre-approval codes to swap " + txAmount + " of your ",
        fromToken?.symbol.toUpperCase()
      );

      const res = await fetch(
        "https://api.1inch.exchange/v3.0/" +
          networkId +
          "/approve/calldata?" +
          "tokenAddress=" +
          fromToken?.tokenAddress +
          "&amount=" +
          txAmount
      ).then((response) => response.json());

      await sendTransaction({
        from: user.attributes.ethAddress,
        ...res,
      });

      setDialog(
        "Submitting swap transaction.  Please review and sign in MetaMask."
      );

      await fetch(
        "https://api.1inch.exchange/v3.0/" +
          networkId +
          "/swap?" +
          "fromTokenAddress=" +
          fromToken.tokenAddress +
          "&toTokenAddress=" +
          toToken.address +
          "&amount=" +
          txAmount +
          "&fromAddress=" +
          user?.attributes.ethAddress +
          "&slippage=3"
      ).then((response) => response.json());

      setDialog("Recieved.  Check console log.");
      setQuoteValid(0);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  return (
    <Tooltip title="Submit swap order.">
      <LoadingButton
        className="ExpertButton"
        variant="contained"
        sx={{ boxShadow: "var(--boxShadow)", mr: 2 }}
        onClick={handlePress}
        loading={isLoading}
      >
        Do it.
      </LoadingButton>
    </Tooltip>
  );
};
