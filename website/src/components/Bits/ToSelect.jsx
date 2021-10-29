import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";


import { use1InchTokenList } from "../../hooks/use1InchTokenList";

export const ToSelect = () => {
  const [ value, setValue ] =  useState('');


  const { tokens } = use1InchTokenList();
  const { fromSymbol, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();

  const handleChange = async (e) => {

    let selectedToken = e.target.value;

    setValue(selectedToken)
    if (selectedToken) {
      let selectedSymbol =selectedToken.symbol;
      let token = tokens.find(
        (token) => token.symbol === selectedSymbol
      );
      setToToken(token);
      setDialog(
        "Press the 'Get Swap Quote' " +
          "to get a quote to swap " +
          fromSymbol +
          " to " +
          selectedSymbol +
          "."
      );
    } else {
      setToToken();
      setDialog("Select a token to receive from the pull-down menu.");
    }
    setQuoteValid("false");
  };

  return (
    <Box sx={{width:'100%'}}>
      <FormControl id="swapto" fullWidth>
        <InputLabel id="to-select-label">Select a token to receive.</InputLabel>
        <Select
          id="toToken"
          label="Select a token to receive."
          sx={{ 
            // boxShadow: 'var(--boxShadow)', 
          }}
          onChange={handleChange}
          value = {value}
        >
          {tokens.filter(
            (token) => token.symbol !== fromSymbol
          ).map((token) => {
            return (
              <MenuItem key={token.networkId + token.name} value={token}>
                {token.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};