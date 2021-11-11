import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';

import { Box, Button, Stack } from '@mui/material';

import { SendPanel } from '../Blocks/SendPanel';
import { AddressPanel } from '../Blocks/AddressPanel';
import { Heading } from '../UW/Heading';

import { useExperts } from '../../contexts/expertsContext';
import { useNetwork } from '../../contexts/networkContext';
import { usePolygonNetwork } from '../../hooks/usePolygonNetwork';

export const SendReceive = () => {
  const { setActionMode, setDialog } = useExperts();
  const [localMode, setLocalMode] = useState('none');

  const { isAuthenticated } = useMoralis();
  const { switchNetworkToPolygon } = usePolygonNetwork();
  const { isPolygon } = useNetwork();

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
    setActionMode('send');
    setDialog('Would you like to send or receive cryptocurrency?');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMode = async () => {
    if (!isPolygon) {
      setDialog('Switch network to Polygon');
      return;
    }

    setLocalMode('send');
    setActionMode('send');
    setDialog('Select a currency to send.');
  };

  const handleReceiveMode = () => {
    setLocalMode('receive');
    setActionMode('receive');
    setDialog(
      'Copy your address for pasting or ' +
        'select amount to request to generate a QR code.'
    );
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
      <Heading variant="h4">Transfer Cryptocurrency</Heading>
      <br />
      <Stack sx={{ alignItems: 'center' }}>
        <Stack direction="row">
          <Button
            onClick={handleSendMode}
            sx={{ mr: 1, boxShadow: 'var(--boxShadow)' }}
          >
            Send
          </Button>
          <Button
            onClick={handleReceiveMode}
            sx={{ boxShadow: 'var(--boxShadow)' }}
          >
            Receive
          </Button>
        </Stack>
      </Stack>
      <br />
      {localMode === 'send' && <SendPanel />}
      {localMode === 'receive' && <AddressPanel />}
    </Box>
  );
};
