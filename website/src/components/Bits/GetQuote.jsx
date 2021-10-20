import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Tooltip,
} from "@chakra-ui/react";
import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";
import { useMoralis } from "react-moralis";

const oneInchHead = "https://api.1inch.exchange/v3.0/1/quote?";

export const GetQuote = () => {
  const { Moralis } = useMoralis();
  const { fromSymbol, fromAddress, toSymbol, toAddress, txAmount } =
    useActions();
  const {
    setQuoteValid,
    setFromToken,
    setFromTokenAmount,
    setProtocols,
    setToToken,
    setToTokenAmount,
    setEstimatedGas,
  } = useQuote();

  const goto1Inch = async (quote) => {
    console.groupCollapsed();
    console.log(
      "Transferring ",
      txAmount,
      " ",
      fromSymbol,
      " to ",
      toSymbol,
      "..."
    );
    console.groupEnd();

    const oneInchQuote = await Moralis.Plugins.oneInch.quote({
      chain: 'eth',
      fromTokenAddress: fromAddress, // The token you want to swap
      toTokenAddress: toAddress, // The token you want to receive
      amount: txAmount,
    });

    if (oneInchQuote.fromToken) {
      setFromToken(oneInchQuote.fromToken);
      setFromTokenAmount(oneInchQuote.fromTokenAmount);
      setProtocols(oneInchQuote.protocols[0]);
      setToToken(oneInchQuote.toToken);
      setToTokenAmount(oneInchQuote.toTokenAmount);
      setEstimatedGas(oneInchQuote.estimatedGas);
      setQuoteValid("true");
    }
  };

  return (
    <Box>
      <FormControl id="swapstart">
        <Tooltip label="Get quote for the current toke swap selections.">
          <Button
            enabled={txAmount > 0 ? "true" : "false"}
            onClick={async () => {
              await goto1Inch();
            }}
          >
            Preview Swap Order
          </Button>
        </Tooltip>
        <FormErrorMessage>Well shoot.</FormErrorMessage>
      </FormControl>
    </Box>
  );
};
