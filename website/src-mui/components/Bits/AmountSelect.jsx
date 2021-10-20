import { useEffect, useState } from "react";
import { Box,FormControl,TextField, InputAdornment} from '@mui/material';

import { usePositions } from "../../hooks/usePositions";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";

export const AmountSelect = () => {
  const [maxSpend, setMaxSpend] = useState(0);
  const [decimals, setDecimals] = useState(18);
  const [value, setValue] = useState(0);
  const { positions, waiting } = usePositions();
  const { fromSymbol, setTxAmount } = useActions();
  const { setDialog } = useExperts();

  //  We are not going to use this any more.
  // const format = (val) =>
  //   fromSymbol === undefined ? "" : val + " " + fromSymbol?.toUpperCase();

  // const parse = (val) =>
  //   fromSymbol === undefined? "" : val.replace(" " + fromSymbol?.toUpperCase(), "");

  useEffect(() => {
    let position = {};
    if (!waiting) {
      if (fromSymbol) {
        position = positions.find(
          (position) =>
            position.symbol.toUpperCase() === fromSymbol?.toUpperCase()
        );
        setMaxSpend(position ? position.tokens : 0);
        setDecimals(position ? position.decimals : 0);
      } else {
        console.log("AmountSelect::useEffect::!waiting::noFromSymbol.");
      }
    } else {
      console.log("AmountSelect::useEffect::waiting.");
    }
    // setActionMode("recieve");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, fromSymbol, waiting]);

  return (
    <Box>
      <FormControl id="swapamount" fullWidth>
        <TextField
          label="Amount"
          type="number"
          sx={{ width: 150}}
          InputProps={{ 
            min: 0,
            max: maxSpend, 
            endAdornment: <InputAdornment position="end">{fromSymbol}</InputAdornment>,
          }}
          onChange={(event) => {
            console.log(event.target.value);
            let valueString = event.target.value;
            setValue(valueString);
            setTxAmount(valueString * 10 ** decimals);
            if (valueString > 0) {
              setDialog(
                "Now using " +
                ((100 * valueString) / maxSpend).toFixed(0) +
                "% of your " +
                fromSymbol +
                " in this action.  " +
                "Press one of the action buttons " +
                "when you are ready " +
                "to choose what to do with these tokens."
              );
            } else {
              setDialog(
                "Use the up and down arrows " +
                "to select how much " +
                fromSymbol +
                " to use in this action.  " +
                "Arrows step in 10% increments of your balance."
              );
            }
          }}
         value={value}
        />       
      </FormControl>
    </Box>
  );
};