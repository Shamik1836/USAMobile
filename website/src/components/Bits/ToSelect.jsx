import { useEffect, useMemo } from "react";
import { Autocomplete, TextField, Box } from "@mui/material";

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";
import { useNetwork } from "../../contexts/networkContext";
import tokenList from "../../data/TokenList.json";

export const ToSelect = () => {
  const { fromSymbol, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();
  const { networkId } = useNetwork();
  const tokens = useMemo(
    () =>
      tokenList.filter(
        (item) =>
          item.networkId == networkId &&
          item.symbol.toLowerCase() !== fromSymbol.toLowerCase()
      ),
    [networkId, fromSymbol]
  );

  useEffect(() => {
    return () => {
      setToToken();
    };
  }, [setToToken]);

  const handleChange = async (e, value) => {
    if (value) {
      setToToken(value);
      setDialog(
        "Press the 'Get Swap Quote' " +
          "to get a quote to swap " +
          fromSymbol +
          " to " +
          value.symbol +
          "."
      );
    } else {
      setToToken();
      setDialog("Select a token to receive from the pull-down menu.");
    }
    setQuoteValid("false");
  };

  const filterOptions = (options, { inputValue }) => {
    const str = inputValue.toLowerCase();
    return options.filter(
      (o) =>
        o.symbol.toLowerCase().includes(str) ||
        o.name.toLowerCase().includes(str)
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Autocomplete
        options={tokens}
        getOptionLabel={(option) => `${option.symbol.toUpperCase()} (${option.name})`}
        filterOptions={filterOptions}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <img width="30" src={option.image} alt="" style={{borderRadius: '50%'}} />
            <span style={{ flex: 1, margin: "0 8px" }}>{option.symbol.toUpperCase()}</span>
            <span style={{ opacity: 0.5 }}>{option.name}</span>
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Select a token to receive." />
        )}
        onChange={handleChange}
      />
    </Box>
  );
};
