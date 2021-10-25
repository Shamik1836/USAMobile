import { useMoralis } from "react-moralis";
import { Box,Button,FormControl,Tooltip} from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";

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
    await Moralis.initPlugins();
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
        <Tooltip title="Get quote for the current toke swap selections.">
          <span>
          <Button
            variant="contained"
            disabled={txAmount > 0 ? false : true}
            onClick={async () => {
              await goto1Inch();
            }}
          >
            Preview Swap Order
          </Button>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};