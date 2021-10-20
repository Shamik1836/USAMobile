import { useState } from "react";

import { Button, Tooltip } from "@chakra-ui/react";

import { useQuote } from "../../contexts/quoteContext";
import { useExperts } from "../../contexts/expertsContext";
import { useActions } from "../../contexts/actionsContext";

import { useMoralis } from "react-moralis";

const oneInchApprove = "https://api.1inch.exchange/v3.0/1/approve/calldata";
const oneInchSwap = "https://api.1inch.exchange/v3.0/1/swap?";
// const refAddress = "0x9A8A1C76e46940462810465F83F44dA706953F69";

export const DoItButton = (props) => {
  const { setQuoteValid, fromToken, toToken } = useQuote();
  const { txAmount } = useActions();
  const { Moralis, user } = useMoralis();
  const { setDialog } = useExperts();

  const [preApproved, setPreApproved] = useState(false);

  const preApproveTx = async () => {
    setDialog(
      "Retrieving pre-approval codes to swap " + txAmount + " of your ",
      fromToken?.symbol.toUpperCase()
    );
    const web3 = await Moralis.Web3.enable();
    await fetch(
      oneInchApprove +
        "?tokenAddress=" +
        fromToken?.address +
        "&amount=" +
        txAmount
    )
      .then((response) => response.json())
      .then((response) => {
        setDialog("1Inch approval code received.");
        console.groupCollapsed("DoItButton::preApprove");
        console.log("fromToken?.address:", fromToken?.address);
        console.log("amount:", txAmount);
        console.log("Response:", response);
        console.groupEnd();
        return response;
      })
      .then((response) => {
        setDialog(
          "Transmitting pre-approval code to the send token.  " +
            "Please sign this transaction in your wallet."
        );
        const Tx = {
          from: user?.attributes["ethAddress"],
          to: response.to,
          data: response.data,
          gasPrice: response.gasPrice,
          value: response.value,
        };
        console.groupCollapsed("PreApprovalTx");
        console.log("Tx:", Tx);
        console.groupEnd();
        web3.eth.sendTransaction(Tx, (err, hash) => {
          if (err) {
            setDialog("Swap was not pre-approved.");
            console.groupCollapsed("PreApprovalError");
            console.log(err);
            console.groupEnd();
            setPreApproved(false);
          } else {
            setDialog("Swap is now pre-approved.");
            console.groupCollapsed("PreApprovalHash");
            console.log(hash);
            console.groupEnd();
            setPreApproved(true);
          }
        });
      });
  };

  const handlePress = async () => {
    await preApproveTx();

    if (preApproved) {
      setDialog(
        "Submitting swap transaction.  Please review and sign in MetaMask."
      );
      const receipt = await Moralis.Plugins.oneInch.swap({
        chain: 'eth', // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress:fromToken.address, // The token you want to swap
        toTokenAddress: toToken.address, // The token you want to receive
        amount: txAmount,
        fromAddress: user?.attributes["ethAddress"], // Your wallet address
        slippage: 3,
      });
      setDialog("Recieved.  Check console log.");
    }
    setQuoteValid(0);
  };

  return (
    <Tooltip label="Submit swap order.">
      <Button
        mr={2}
        className="ExpertButton"
        boxShadow="dark-lg"
        onClick={handlePress}
      >
        Do it.
      </Button>
    </Tooltip>
  );
};
