import { useEffect } from 'react';

import { Box } from '@mui/material';
import { useMoralis } from 'react-moralis';

import { TokenTable } from '../Blocks/TokenTable';
import { Heading } from '../UW/Heading';

import { useExperts } from '../../contexts/expertsContext';
import { useNetwork } from '../../contexts/networkContext';
import { usePolygonNetwork } from '../../hooks/usePolygonNetwork';
import ABI from '../../data/FLATSIM_ABI.json';

export const PortfolioPrices = () => {
  const { setActionMode, setDialog } = useExperts();

  const { isAuthenticated, web3 } = useMoralis();
  const { isPolygon } = useNetwork();
  const { switchNetworkToPolygon } = usePolygonNetwork();

  useEffect(() => {
    if (isAuthenticated) {
      if (!isPolygon) {
        setDialog('Check your Metamast and Accept Polygon Switch.');
        switchNetworkToPolygon();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isPolygon]);

  useEffect(() => {
    setActionMode('portfolio');
    setDialog('Select a currency to view transaction histories.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // test();
  }, []);

  const test = async () => {
    const ADDRESS = '0x131D5Cf03C7649627C66f85dc50da93BEA5CA5F3';
    var accounts = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(ABI, ADDRESS);
    const result = await contract.methods
      .checkAccountsBalance('0xA0aC14bb5784bCcb07E2A64DeaDE16d8Dcd53ad8')
      .call();
    const fee = await contract.methods
      .checkAccountsFeeModifier('0xA0aC14bb5784bCcb07E2A64DeaDE16d8Dcd53ad8')
      .call();
    console.log('++ result', contract, result, fee);
  };
  return (
    <Box sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
      <Heading variant="h4">Portfolio and Prices</Heading>
      <br />
      <TokenTable />
    </Box>
  );
};
