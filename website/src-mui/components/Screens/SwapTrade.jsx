import { useEffect } from "react";
import { Box } from '@mui/material';

import { SwapPanel } from "../Blocks/SwapPanel";

import { useExperts } from "../../contexts/expertsContext";
import { Heading } from '../UW/Heading';


export const SwapTrade = () => {
  const { setActionMode, setDialog } = useExperts();

  useEffect(() => {
    setActionMode("swap");
    setDialog("Select a token to convert.");
  }, [setActionMode, setDialog]);

  return (
    <Box sx={{textAlign: 'center', mt:1}}>
      <Heading variant="h4">
        Swap/Trade
      </Heading>
      <br />
      <SwapPanel />
    </Box>
    
  );
};
