
import { Box, Stack } from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";


import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";

// Swap mode.
import { ToSelect } from "../Bits/ToSelect";
import { RequestQuote } from "../Bits/RequestQuote";
import { QuotePanel } from "../Scrapbox/QuotePanel";



export const SwapPanel = () => {
  const { fromSymbol } = useActions();
  const { quoteValid } = useQuote();


  return (
    <Box sx={{ display: 'inline-flex', minWidth: 420, maxWidth:660, m: 'auto', backgroundImage: 'var(--bg)',
      borderRadius: '1.5rem',
      borderWidth: 2,
    }}>
      <Stack sx={{alignItems: 'center', justifyContent: 'center', px: 5, py: 2.5}}>
        <FromSelect />
        {!!fromSymbol && (
          <>
            <Stack direction='row' spacing={1} sx={{my: 3}}>
              <AmountSelect />
              <ToSelect/>
            </Stack>
            <RequestQuote />
          </>
        )}
        {quoteValid === "true" && <QuotePanel />}
      </Stack>
    </Box>
  );
};