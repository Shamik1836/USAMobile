import React from "react";
import { Avatar, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";
import { useExperts } from "../../contexts/expertsContext";
import { DoItButton } from "./DoItButton";

export const QuotePanel = () => {
  const [visible, setVisible] = React.useState(false);
  const {
    fromToken: { price },
  } = useActions();
  const {
    setQuoteValid,
    fromToken,
    fromTokenAmount,
    protocols,
    toToken,
    toTokenAmount,
    estimatedGas,
  } = useQuote();
  const { setDialog } = useExperts();

  const handleCancel = (e) => {
    setQuoteValid("false");
    setDialog("Change your swap settings to recieve a new quote.");
  };

  const ethGas = estimatedGas / 10 ** 9;
  const usdGas = (ethGas * price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <VStack
      alignItems="center"
      justifyContent="center"
      borderWidth={2}
      borderRadius="3xl"
      paddingLeft={10}
      paddingRight={10}
      paddingTop={5}
      paddingBottom={5}
      spacing={6}
    >
      <Text>Swap Estimate:</Text>
      <HStack>
        <Text>
          Trade {(fromTokenAmount / 10 ** fromToken.decimals).toPrecision(3)}
        </Text>
        <Avatar name={fromToken.name} src={fromToken.logoURI} size="sm" />
        <Text>{fromToken.symbol}</Text>
        <Text>
          For {(toTokenAmount / 10 ** toToken.decimals).toPrecision(3)}
        </Text>
        <Avatar name={toToken.name} src={toToken.logoURI} size="sm" />
        <Text>{toToken.symbol}</Text>
      </HStack>
      <Text>
        Spending {ethGas} ETH (${usdGas}) transaction fee across:{" "}
        <span
          style={{ cursor: "pointer" }}
          onClick={() => setVisible(!visible)}
        >
          (?)
        </span>
      </Text>

      {visible && (
        <HStack>
          {protocols.map((dex) => (
            <Text key={dex[0].name}> {dex[0].name}</Text>
          ))}
        </HStack>
      )}

      <HStack>
        <DoItButton />
        <Button onClick={handleCancel} boxShadow="dark-lg">
          Cancel
        </Button>
      </HStack>
    </VStack>
  );
};
