import { FormControl, Flex, FormErrorMessage, Select } from "@chakra-ui/react";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";

const TokenList = require("../../data/TokenList.json");

export const ToSelect = () => {
  const { fromSymbol, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();

  const handleChange = async (e) => {
    const { selectedIndex } = e.target.options;
    if (selectedIndex > 0) {
      const symbol = e.target.value;
      const token = TokenList.find((token) => token.symbol === symbol);
      setToToken(token);
      setDialog(
        "Press the 'Get Swap Quote' " +
          "to get a quote to swap " +
          fromSymbol?.toUpperCase() +
          " to " +
          symbol.toUpperCase() +
          "."
      );
    } else {
      setToToken();
      setDialog("Select a token to receive from the pull-down menu.");
    }
    setQuoteValid("false");
  };

  return (
    <Flex width="100%">
      <FormControl id="swapto" isRequired>
        <Select
          id="toToken"
          placeholder="Select a token to receive."
          boxShadow="dark-lg"
          onChange={handleChange}
        >
          {TokenList.filter(
            (token) => token.symbol.toUpperCase() !== fromSymbol?.toUpperCase()
          ).map((token) => {
            return (
              <option key={token.networkId + token.name} value={token.symbol}>
                Into {token.name}
              </option>
            );
          })}
        </Select>
        <FormErrorMessage>
          Please select from the given list of input tokens.
        </FormErrorMessage>
      </FormControl>
    </Flex>
  );
};
