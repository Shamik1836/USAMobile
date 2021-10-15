import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Tooltip,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";

const oneInchHead = "https://api.1inch.exchange/v3.0/1/quote?";

export const RequestQuote = () => {
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
  const { setDialog } = useExperts();
  const { colorMode } = useColorMode();
  const toast = useToast();

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

    await fetch(
      oneInchHead +
        "fromTokenAddress=" +
        fromAddress +
        "&toTokenAddress=" +
        toAddress +
        "&amount=" +
        txAmount
    )
      .then((response) => response.json())
      .then((oneInchQuote) => {
        console.groupCollapsed("RequestQuote::response.");
        console.log("Recieved Quote:", oneInchQuote);
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
          toast({
            description: oneInchQuote.message,
            status: "error",
            isClosable: true,
          });
          return;
        }
        console.groupEnd();
      });
  };

  return (
    <Box>
      <FormControl id="sendstart">
        <Tooltip label="Preview token transmission.">
          <Button
            isDisabled={!txAmount || !toSymbol}
            variant={colorMode === "light" ? "outline" : "solid"}
            boxShadow="dark-lg"
            onClick={handlePress}
          >
            Get Swap Quote
          </Button>
        </Tooltip>
        <FormErrorMessage>Well shoot.</FormErrorMessage>
      </FormControl>
    </Box>
  );
};
