import React from 'react';
import { Avatar, Button, Stack, Typography } from '@mui/material';

import { useQuote } from '../../contexts/quoteContext';
import { useExperts } from '../../contexts/expertsContext';
import { DoItButton } from './DoItButton';

export const QuotePanel = () => {
  const {
    setQuote,
    fromToken,
    fromTokenAmount,
    toToken,
    toTokenAmount,
    estimatedGas,
  } = useQuote();

  const { setDialog } = useExperts();

  const handleCancel = (e) => {
    setQuote();
    setDialog('Change your swap settings to recieve a new quote.');
  };

  const gas = estimatedGas / 10 ** 7;

  // const usdGas = (gas * price).toLocaleString("en-US", {
  //   minimumFractionDigits: 2,
  //   maximumFractionDigits: 2,
  // });

  return (
    <Stack
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderRadius: '3px',
        px: 10,
        py: 2,
      }}
      spacing={2}
    >
      <Typography variant="h5">Swap Estimate:</Typography>
      <Stack direction="row" alignItems="center">
        <Typography>
          Trade {(fromTokenAmount / 10 ** fromToken.decimals).toPrecision(3)}
        </Typography>
        <Avatar
          name={fromToken.name}
          src={fromToken.logoURI}
          sx={{ width: 30, height: 30, mx: 0.5 }}
        />
        <Typography>
          {fromToken.symbol} For{' '}
          {(toTokenAmount / 10 ** toToken.decimals).toPrecision(3)}
        </Typography>
        <Avatar
          name={toToken.name}
          src={toToken.logoURI}
          size="sm"
          sx={{ width: 30, height: 30, mx: 0.5 }}
        />
        <Typography>{toToken.symbol}</Typography>
      </Stack>
      <Typography>Estimated network fee: {gas} MATIC</Typography>
      <Stack direction="row">
        <DoItButton />
        <Button
          onClick={handleCancel}
          variant="contained"
          sx={{ boxShadow: 'var(--boxShadow)' }}
        >
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
};
