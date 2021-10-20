import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { usePositions } from "../../hooks/usePositions";
import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useGradient } from "../../contexts/gradientsContext";


export const FromSelect = () => {

  const [ value, setValue ] =  useState('');
  const { positions, waiting } = usePositions();
  const { setFromAddress, setFromSymbol, setToSymbol, setTxAmount } =useActions();
  const { setDialog } = useExperts();
  const { darkBoxShadow } = useGradient();


  const handleChange = (e) => {
    setValue(e.target.value);
    let v = e.target.value;
   
    if (v) {
      setFromSymbol(v.symbol);
      setFromAddress(v.tokenAddress);
      setDialog(
        "Use the 'Select amount' to set how much " +
          v.symbol +
          " to use in this action. "
      );
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

  return (
    <Box>
      <FormControl sx={{ 
        // boxShadow: darkBoxShadow
      }} id="swapfrom" fullWidth>
        <InputLabel id="form-select-label">Select a token to act with.</InputLabel>
        <Select 
          id="fromToken"
          label="Select a token to act with."
          sx={{ 
            minWidth: 340,
            //boxShadow: darkBoxShadow
          }}
          onChange={handleChange}
          value = {value}
        >
          {!waiting &&
            positions.map((position) => {
              return (
                <MenuItem key={position.symbol} value={position}>
                From {position.tokens && position.tokens.toPrecision(3)}{" "}
                  {position.name} @ $
                  {position.price && position.price.toFixed(2)}/
                  {position.symbol && position.symbol.toUpperCase()} = $
                  {position?.value.toFixed(2)}
                </MenuItem>                  
              );
            })}
        </Select>
      </FormControl>
    </Box>
  );
};