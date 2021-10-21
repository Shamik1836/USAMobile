import { useMoralis } from "react-moralis";
import { Box,Button,FormControl,Tooltip} from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";

import { useColorMode } from "../../contexts/colorModeContext";
import { useGradient } from "../../contexts/gradientsContext";

// const oneInchHead = "https://api.1inch.exchange/v3.0/1/quote?";  // Not using this 


export const RequestQuote = () => {
 const { darkBoxShadow } = useGradient();
 const { colorMode } = useColorMode();

 const { fromSymbol, fromAddress, toSymbol, toAddress, txAmount } = useActions();

   const {
    setQuoteValid,
    setFromToken,
    setFromTokenAmount,
    setProtocols,
    setToToken,
    setToTokenAmount,
    setEstimatedGas,
  } = useQuote();
  const { setDialog } = useExperts();
  const { Moralis } = useMoralis();
  
  // const toast = useToast();


  const handlePress = async () => {
    console.groupCollapsed("GetQuote::inputs");
    console.debug("Received fromSymbol: ", fromSymbol);
    console.debug("Received fromAddress: ", fromAddress);
    console.debug("Received toSymbol: ", toSymbol);
    console.debug("Received toAddress ", toAddress);
    console.debug("Received txAmount: ", txAmount);
    console.groupEnd();

    setDialog(
      "Estimating costs to swap " + fromSymbol + " to " + toSymbol + " ... "
    );
    await Moralis.initPlugins();
    const oneInchQuote = await Moralis.Plugins.oneInch.quote({
      chain: 'eth',
      fromTokenAddress: fromAddress, // The token you want to swap
      toTokenAddress: toAddress, // The token you want to receive
      amount: txAmount,
    });

    if (oneInchQuote.protocols !== undefined) {
      setFromToken(oneInchQuote.fromToken);
      setFromTokenAmount(oneInchQuote.fromTokenAmount);
      setProtocols(oneInchQuote.protocols[0]);
      setToToken(oneInchQuote.toToken);
      setToTokenAmount(oneInchQuote.toTokenAmount);
      setEstimatedGas(oneInchQuote.estimatedGas);
      setQuoteValid("true");
      setDialog(
        "Push 'Do it!' to execute swap.  Or adjust inputs to update quote."
      );
    } else {
      setDialog(
        "Something went wrong: " +
          oneInchQuote.error +
          " re: " +
          oneInchQuote.message
      );
      setQuoteValid("false");
      // toast({
      //   description: oneInchQuote.message,
      //   status: "error",
      //   isClosable: true,
      // });
      return;
    }
    console.groupEnd();
  };

  return (
    <Box>
      <FormControl id="sendstart" fullWidth>
        <Tooltip title="Preview token transmission.">
          <span>
          <Button
            disabled={!txAmount || !toSymbol}
            variant={colorMode === "light" ? "outlined" : "contained"}
            sx={{ boxShadow:darkBoxShadow }}
            onClick={handlePress}
          >
            Get Swap Quote
          </Button>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};