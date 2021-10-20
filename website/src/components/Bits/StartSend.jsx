import { Box, Button, Tooltip } from "@chakra-ui/react";
import { useWeb3Transfer } from "react-moralis";
import { useActions } from "../../contexts/actionsContext";

export const StartSend = () => {
  const { fromAddress, toAddress, txAmount } = useActions();
  const { fetch, isFetching } = useWeb3Transfer({
    amount: txAmount,
    receiver: toAddress,
    type: "erc20",
    contractAddress: fromAddress,
  });

  return (
    <Box>
      <Tooltip label="Preview token transmission.">
        <Button
          isLoading={isFetching}
          isDisabled={!txAmount || !toAddress}
          boxShadow="dark-lg"
          onClick={fetch}
        >
          Preview Send Order
        </Button>
      </Tooltip>
    </Box>
  );
};
