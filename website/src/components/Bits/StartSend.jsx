import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Tooltip,
} from "@chakra-ui/react";
import { useMoralis } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";

export const StartSend = () => {
  const { Moralis } = useMoralis();
  const { fromSymbol, fromAddress, toSymbol, toAddress, txAmount } =
    useActions();

  const handleClick = () => {
    console.groupCollapsed("StartSend");
    console.debug("Received fromSymbol: ", fromSymbol);
    console.debug("Received fromAddress: ", fromAddress);
    console.debug("Received toSymbol: ", toSymbol);
    console.debug("Received toAddress ", toAddress);
    console.debug("Received txAmount: ", txAmount);
    console.groupEnd();

    const options = {
      type: "erc20",
      amount: Moralis.Web3API.Units.Token(txAmount, "18"),
      receiver: toAddress,
      contractAddress: fromAddress,
    };
    Moralis.Web3API.transfer(options).then((result) => {
      console.log("done.");
    });
  };

  return (
    <Box>
      <FormControl id="sendstart">
        <Tooltip label="Preview token transmission.">
          <Button
            enabled={txAmount > 0 ? "true" : "false"}
            boxShadow="dark-lg"
            onClick={handleClick}
          >
            Preview Send Order
          </Button>
        </Tooltip>
        <FormErrorMessage>Well shoot.</FormErrorMessage>
      </FormControl>
    </Box>
  );
};
