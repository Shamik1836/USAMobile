import {
  Box,
  Button,
  FormControl,
  Tooltip,
} from '@mui/material';
import { useMoralis } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";
import { useGradient } from "../../contexts/gradientsContext";


export const StartSend = () => {
  const { Moralis } = useMoralis();
  const { darkBoxShadow } = useGradient();

  const { fromSymbol, fromAddress, toSymbol, toAddress, txAmount } = useActions();

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
          <span>
            <Button
              variant="contained"
              disabled={txAmount > 0 ? "false" : "true"}
              sx={{ boxShadow: darkBoxShadow }}
              onClick={handleClick}
            >
              Preview Send Order
            </Button>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};