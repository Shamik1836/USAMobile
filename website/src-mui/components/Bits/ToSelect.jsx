import { useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";
import { useGradient } from "../../contexts/gradientsContext";


const TokenList = require("../../data/TokenList.json");

export const ToSelect = () => {
  const [ value, setValue ] =  useState('');
  const { darkBoxShadow } = useGradient();


  const { fromSymbol, fromAddress, setToSymbol, setToAddress, txAmount } = useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();

  const handleChange = async (e) => {
    console.groupCollapsed("ToSelect::handleChange():");
    console.log("TokenList:", TokenList);
    let selectedToken = e.target.value;
    setValue(selectedToken)
    console.log("selectedToken:", selectedToken);
    if (selectedToken) {
      let selectedSymbol =selectedToken.symbol;
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
    <Box>
      <FormControl id="swapto" fullWidth>
        <InputLabel id="form-select-label">Select a token to receive.</InputLabel>
        <Select
          id="toToken"
          placeholder="Select a token to receive."
          sx={{ 
            // boxShadow: darkBoxShadow, 
            width:320
          }}
          onChange={handleChange}
          value = {value}
        >
          {TokenList.filter(
            (token) => token.symbol.toUpperCase() !== fromSymbol.toUpperCase()
          ).map((token) => {
            return (
              <MenuItem key={token.networkId + token.name} value={token}>
                   Into {token.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};