import { useState } from 'react';
import { Box, FormControl, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMoralis } from 'react-moralis';

import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import { useQuote } from '../../contexts/quoteContext';
import { useColorMode } from '../../contexts/colorModeContext';
import { useNetwork } from '../../contexts/networkContext';

export const RequestQuote = () => {
  const { Moralis } = useMoralis();
  const { networkAlias } = useNetwork();
  const [loading, setLoading] = useState(false);
  const { fromSymbol, fromAddress, toSymbol, toAddress, txAmount } =
    useActions();
  const {
    setQuoteValid,
    setFromToken,
    setFromTokenAmount,
    setProtocols,
    setToToken,
    setToTokenAmount,
    setEstimatedGas,
  } = useQuote();
  const { setDialog } = useExperts();
  const { colorMode } = useColorMode();

  const handlePress = async () => {
    setDialog(
      'Estimating costs to swap ' + fromSymbol + ' to ' + toSymbol + ' ... '
    );

    setLoading(true);

    try {
      const quote = await Moralis.Plugins.oneInch.quote({
        chain: networkAlias,
        fromTokenAddress: fromAddress,
        toTokenAddress: toAddress,
        amount: txAmount,
      });

      if (quote.protocols !== undefined) {
        setFromToken(quote.fromToken);
        setFromTokenAmount(quote.fromTokenAmount);
        setProtocols(quote.protocols[0]);
        setToToken(quote.toToken);
        setToTokenAmount(quote.toTokenAmount);
        setEstimatedGas(quote.estimatedGas);
        setQuoteValid('true');
        setDialog(
          "Push 'Do it!' to execute swap.  Or adjust inputs to update quote."
        );
      } else {
        setDialog(
          'Something went wrong: ' + quote.error + ' re: ' + quote.message
        );
        setQuoteValid('false');
      }
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  return (
    <Box>
      <FormControl id="sendstart" fullWidth>
        <Tooltip title="Preview token transmission.">
          <span>
            <LoadingButton
              disabled={!txAmount || !toSymbol}
              variant={colorMode === 'light' ? 'outlined' : 'contained'}
              sx={{ boxShadow: 'var(--boxShadow)' }}
              loading={loading}
              onClick={handlePress}
            >
              Get Swap Quote
            </LoadingButton>
          </span>
        </Tooltip>
      </FormControl>
    </Box>
  );
};
