import { FormControl, Flex, FormErrorMessage, Select } from "@chakra-ui/react";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";

const TokenList = require("../../data/TokenList.json");

export const ToSelect = () => {
  const { fromSymbol, fromAddress, setToSymbol, setToAddress, txAmount } =
    useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();

  const handleChange = async (e) => {
    console.groupCollapsed("ToSelect::handleChange():");
    console.log("TokenList:", TokenList);
    console.log("event:", e);
    let selectedIndex = e.target.options.selectedIndex;
    console.log("selectedIndex:", selectedIndex);
    if (selectedIndex > 0) {
      let selectedSymbol =
        e.target.childNodes[selectedIndex].attributes.value.value;
      console.log("selectedOption:", selectedSymbol);
      setToSymbol(selectedSymbol.toUpperCase());
      let selectedRecord = TokenList.find(
        (token) => token.symbol === selectedSymbol
      );
      console.log("selectedRecord:", selectedRecord);
      let selectedAddress = selectedRecord.address;
      console.log("selectedAddress:", selectedAddress);
      setToAddress(selectedAddress);
      console.log("...quote request parameters:");
      console.log("fromSymbol:", fromSymbol);
      console.log("fromTokenAddress: **", fromAddress);
      console.log("toSymbol:", selectedSymbol);
      console.log("toAddress: **", selectedAddress);
      console.log("amount: **", txAmount);
      console.groupEnd();
      setDialog(
        "Press the 'Get Swap Quote' " +
          "to get a quote to swap " +
          fromSymbol +
          " to " +
          selectedSymbol.toUpperCase() +
          "."
      );
    } else {
      console.log("null selection made.");
      console.groupEnd();
      setToSymbol("");
      setToAddress("");
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
            (token) => token.symbol.toUpperCase() !== fromSymbol.toUpperCase()
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
