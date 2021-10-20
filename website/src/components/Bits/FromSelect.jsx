import { Box, FormControl, FormErrorMessage, Select } from "@chakra-ui/react";
import { usePositions } from "../../hooks/usePositions";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const FromSelect = () => {
  const { positions, waiting } = usePositions();
  const { setFromToken, setToToken } = useActions();
  const { setDialog } = useExperts();

  const handleChange = (e) => {
    let selectedIndex = e.target.options.selectedIndex - 1;
    if (selectedIndex >= 0) {
      const position = positions[selectedIndex];
      setFromToken(position);
      setDialog(
        "Use the 'Select amount' to set how much " +
          position.symbol +
          " to use in this action. "
      );
    } else {
      setFromToken();
      setToToken();
      setDialog(
        "Use the 'Select a token to act with' menu " +
        "to start creating an action plan."
      );
    }
  };

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
