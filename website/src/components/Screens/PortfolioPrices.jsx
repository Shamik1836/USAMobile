import { useEffect } from "react";

import { Box } from '@mui/material';

import { TokenTable } from "../Blocks/TokenTable";
import { useExperts } from "../../contexts/expertsContext";
import { Heading } from '../UW/Heading';

export const PortfolioPrices = () => {
  const { setActionMode, setDialog } = useExperts();


  useEffect(() => {
    console.log('useEffect Called once...');
  }, []);

  useEffect(() => {
    setActionMode("portfolio");
    setDialog("Select a currency to view transaction histories.");
  });

  

  return (
    <Box sx={{textAlign: 'center', mt:1, mb:3}}>
      <Heading variant='h4'>
        Portfolio and Prices
      </Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
