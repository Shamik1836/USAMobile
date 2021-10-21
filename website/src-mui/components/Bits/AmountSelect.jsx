import { useEffect, useState } from "react";
import { Box, FormControl, TextField, InputAdornment } from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const AmountSelect = () => {
  
  // const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("0.00");
  const { fromToken, setTxAmount } = useActions();
  const { setDialog } = useExperts();

  console.log('fromToken:',fromToken);

  useEffect(() => {
    return () => {
      setTxAmount(0);
    };
  }, [setTxAmount]);

  const maxSpend = fromToken?.tokens || 0;
  const decimals = fromToken?.decimals || 18;
  const stepChange = maxSpend/10;

  // We are not using this
  // const format = (val) =>
  //   fromToken
  //     ? isFocused
  //       ? val
  //       : `${val} ${fromToken.symbol.toUpperCase()}`
  //     : "";

   const onChange = (event) => {

    let v = event.target.value;
    console.log('AmountValue:', v);
    if(v < 0 || v > maxSpend);{
      setValue(parseFloat(0).toFixed(2));
      return;
    }
    setValue(parseFloat(v).toFixed(2));
    setTxAmount(v * 10 ** decimals);
    if (v > 0) {
      setDialog(
        "Now using " +
          ((100 * v) / maxSpend).toFixed(0) +
          "% of your " +
          fromToken?.symbol +
          " in this action.  " +
          "Press one of the action buttons " +
          "when you are ready " +
          "to choose what to do with these tokens."
      );
    } else {
      setDialog(
        "Use the up and down arrows " +
          "to select how much " +
          fromToken?.symbol +
          " to use in this action.  " +
          "Arrows step in 10% increments of your balance."
      );
    }
  };

  return (
    <Box>
      <FormControl id="swapamount" fullWidth>
        <TextField
          disabled={!fromToken}
          label="Amount"
          type="number"
          sx={{ width: 150}}
          InputProps={{ 
            inputProps: { min: 0, max: maxSpend, step: stepChange},            
            endAdornment: <InputAdornment position="end">{fromToken?.symbol}</InputAdornment>,
          }}
          onChange={onChange}
          // onFocus={() => setIsFocused(true)}
          // onBlur={() => setIsFocused(false)}
          value={value}
        />       
      </FormControl>
    </Box>
  );
};