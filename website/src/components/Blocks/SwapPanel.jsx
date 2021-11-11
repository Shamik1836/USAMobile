import { Box, Stack } from '@mui/material';

import { useActions } from '../../contexts/actionsContext';
import { useQuote } from '../../contexts/quoteContext';

import { FromSelect } from '../Bits/FromSelect';
import { AmountSelect } from '../Bits/AmountSelect';

// Swap mode.
import { ToSelect } from '../Bits/ToSelect';
import { RequestQuote } from '../Bits/RequestQuote';
import { QuotePanel } from '../Scrapbox/QuotePanel';

export const SwapPanel = () => {
  const { fromSymbol } = useActions();
  const { quoteValid } = useQuote();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        m: 'auto',
        mb: 3,
        backgroundImage: 'var(--bg)',
        border: 4,
        borderRadius: '1.5rem',
        borderColor: 'var(--borderColor)',
      }}
    >
      <Stack
        sx={{ alignItems: 'center', justifyContent: 'center', px: 5, py: 2.5 }}
        spacing={3}
      >
        <FromSelect />
        {!!fromSymbol && (
          <>
            <AmountSelect />
            <ToSelect />
            <RequestQuote />
          </>
        )}
        {quoteValid && <QuotePanel />}
      </Stack>
    </Box>
  );
};
