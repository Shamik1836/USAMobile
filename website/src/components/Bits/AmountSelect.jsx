import {
  Box,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const AmountSelect = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(0);
  const { fromToken, setTxAmount } = useActions();
  const { setDialog } = useExperts();

  useEffect(() => {
    return () => {
      setTxAmount(0);
    };
  }, [setTxAmount]);

  const maxSpend = fromToken?.tokens || 0;
  const decimals = fromToken?.decimals || 18;
  const format = (val) =>
    fromToken
      ? isFocused
        ? val
        : `${val} ${fromToken.symbol.toUpperCase()}`
      : "";

  const onChange = (v) => {
    setValue(v);
    setTxAmount(v * 10 ** decimals);
    if (v > 0) {
      setDialog(
        "Now using " +
          ((100 * v) / maxSpend).toFixed(0) +
          "% of your " +
          fromToken.symbol +
          " in this action.  " +
          "Press one of the action buttons " +
          "when you are ready " +
          "to choose what to do with these tokens."
      );
    } else {
      setDialog(
        "Use the up and down arrows " +
          "to select how much " +
          fromToken.symbol +
          " to use in this action.  " +
          "Arrows step in 10% increments of your balance."
      );
    }
  };

  return (
    <Box w="150px">
      <NumberInput
        isDisabled={!fromToken}
        step={maxSpend / 10}
        max={maxSpend}
        min={0}
        precision={3}
        boxShadow="dark-lg"
        focusInputOnChange={false}
        onChange={onChange}
        value={format(value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </Box>
  );
};
