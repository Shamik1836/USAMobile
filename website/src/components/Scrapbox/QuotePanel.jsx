import React from "react";
import { Avatar, Button, Stack, Typography } from "@mui/material";

import { DoItButton } from "./DoItButton";

import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";
import { useExperts } from "../../contexts/expertsContext";
import { useGradient } from "../../contexts/gradientsContext";


export const QuotePanel = () => {

  const [visible, setVisible] = React.useState(false);
  const {
    fromToken: { price },
  } = useActions();

  const {
    setQuoteValid,
    fromToken,
    fromTokenAmount,
    protocols,
    toToken,
    toTokenAmount,
    estimatedGas,
  } = useQuote();

  const { setDialog } = useExperts();

  const { darkBoxShadow } = useGradient();

  const handleCancel = (e) => {
    setQuoteValid("false");
    setDialog("Change your swap settings to recieve a new quote.");
  };

  const ethGas = estimatedGas / 10 ** 9;

  const usdGas = (ethGas * price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: '3px', px: 10, py: 5 }} spacing={6}>
      <Typography>Swap Estimate:</Typography>
      <Stack direction='row'>
        <Typography>
          Trade {(fromTokenAmount / 10 ** fromToken.decimals).toPrecision(3)}
        </Typography>
        <Avatar name={fromToken.name} src={fromToken.logoURI} size="sm" />
        <Typography>{fromToken.symbol}</Typography>
        <Typography>
          For {(toTokenAmount / 10 ** toToken.decimals).toPrecision(3)}
        </Typography>
        <Avatar name={toToken.name} src={toToken.logoURI} size="sm" />
        <Typography>{toToken.symbol}</Typography>
      </Stack>
      <Typography>
        Spending {ethGas} ETH (${usdGas}) transaction fee across:{" "}
        <span
          style={{ cursor: "pointer" }}
          onClick={() => setVisible(!visible)}
        >
          (?)
        </span>
      </Typography>
      {visible && (
        <Stack direction='row'>
          {protocols.map((dex) => (
            <Typography key={dex[0].name}> {dex[0].name}</Typography>
          ))}
        </Stack>
      )}
      <Stack direction='row'>
        <DoItButton />
        <Button onClick={handleCancel} variant="contained" sx={{ boxShadow: darkBoxShadow }}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
};
