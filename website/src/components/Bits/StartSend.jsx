import { Box, Button, Tooltip } from "@chakra-ui/react";
import { useState } from "react";
import { useMoralis } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";

export const StartSend = () => {
  const { fromAddress, toAddress, txAmount } = useActions();
  const [loading, setLoading] = useState(false)
  const { Moralis } = useMoralis();
  const sendStart = async () => {
    try {
      const options = {
        type: "erc20",
        amount: Moralis.Units.Token(txAmount, "18"),
        receiver: toAddress,
        contractAddress: fromAddress
      }
      setLoading(true)
      await Moralis.transfer(options);
      setLoading(false)
    } catch {
      setLoading(false)
    }

  }

  return (
    <Box>
      <Tooltip label="Preview token transmission.">
        <Button
          isLoading={loading}
          isDisabled={!txAmount || !toAddress}
          boxShadow="dark-lg"
          onClick={sendStart}
        >
          Preview Send Order
        </Button>
      </Tooltip>
    </Box>
  );
};
