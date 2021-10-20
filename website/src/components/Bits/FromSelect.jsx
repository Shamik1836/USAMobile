import { Box, FormControl, FormErrorMessage, Select } from "@chakra-ui/react";
import { useMoralis } from "react-moralis";
import { usePositions } from "../../hooks/usePositions";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const FromSelect = () => {
  const { positions, waiting } = usePositions();
  const { Moralis } = useMoralis();
  const { setFromAddress, setFromSymbol, setToSymbol, setTxAmount } =
    useActions();
  const { setDialog } = useExperts();

  const handleChange = (e) => {
    let selectedIndex = e.target.options.selectedIndex - 1;
    if (selectedIndex >= 0) {
      setFromSymbol(positions[selectedIndex].symbol);
      setFromAddress(positions[selectedIndex].tokenAddress);
      setDialog(
        "Use the 'Select amount' to set how much " +
        positions[selectedIndex].symbol +
        " to use in this action. "
      );
      getSupportedTokens(positions[selectedIndex].symbol.toLowerCase())
    } else {
      setTxAmount(0);
      setFromSymbol("");
      setToSymbol("");
      setDialog(
        "Use the 'Select a token to act with' menu " +
        "to start creating an action plan."
      );
    }
  };

  const getSupportedTokens = async (chain) => {
    const tokens = await Moralis.Plugins.oneInch.getSupportedTokens({
      chain: chain,
    });
    return tokens
  }

  return (
    <Box width="100%">
      <FormControl id="swapfrom" boxShadow="dark-lg" isRequired>
        <Select
          id="fromToken"
          placeholder="Select a token to act with."
          boxShadow="dark-lg"
          onChange={handleChange}
        >
          {!waiting &&
            positions.map((position) => {
              return (
                <option key={position.symbol}>
                  From {position.tokens && position.tokens.toPrecision(3)}{" "}
                  {position.name} @ $
                  {position.price && position.price.toFixed(2)}/
                  {position.symbol && position.symbol.toUpperCase()} = $
                  {position?.value.toFixed(2)}
                </option>
              );
            })}
        </Select>
        <FormErrorMessage>
          Please select from the tokens in your portfolio.
        </FormErrorMessage>
      </FormControl>
    </Box>
  );
};
