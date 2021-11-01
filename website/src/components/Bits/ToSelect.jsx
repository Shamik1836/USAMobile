import { useEffect } from "react";
import { Autocomplete, TextField, Box } from "@mui/material";

import { useActions } from "../../contexts/actionsContext";
import { useExperts } from "../../contexts/expertsContext";
import { useQuote } from "../../contexts/quoteContext";
import { use1InchTokenList } from "../../hooks/use1InchTokenList";

export const ToSelect = () => {
  const tokenList = use1InchTokenList();
  const { fromSymbol, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { setQuoteValid } = useQuote();

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
        options={tokenList}
        getOptionLabel={(option) => `${option.symbol} (${option.name})`}
        filterOptions={filterOptions}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <img width="30" src={option.logoURI} alt="" />
            <span style={{ flex: 1, margin: "0 8px" }}>{option.symbol}</span>
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
