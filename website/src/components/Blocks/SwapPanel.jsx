
import { Box, Stack } from '@mui/material';

import { useActions } from "../../contexts/actionsContext";
import { useQuote } from "../../contexts/quoteContext";

import { useColorMode } from '../../contexts/colorModeContext';
import { useGradient } from "../../contexts/gradientsContext";

import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";

// Swap mode.
import { ToSelect } from "../Bits/ToSelect";
import { RequestQuote } from "../Bits/RequestQuote";
import { QuotePanel } from "../Scrapbox/QuotePanel";



export const SwapPanel = () => {
  const { fromSymbol } = useActions();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();
  const { quoteValid } = useQuote();


  return (
    <Box
      sx={{
        display: 'inline-flex',
        m: 'auto',
        mb:3,
        backgroundImage: (colorMode === 'light' ? lightModeBG : darkModeBG),
        borderWidth: 2,
        borderRadius: '1.5rem'
      }}
      className={(colorMode === 'light' ? 'light-border' : 'dark-border')}>

      <Stack sx={{ alignItems: 'center', justifyContent: 'center', px: 5, py: 2.5 }} spacing={3}>
        <FromSelect />
        {!!fromSymbol && (
          <>
            <AmountSelect />
            <ToSelect />
            <RequestQuote />
          </>
        )}
        {quoteValid === "true" && <QuotePanel />}
      </Stack>
    </Box>
  );
};