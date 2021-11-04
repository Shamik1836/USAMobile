import { useState, useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';

import { Box, Stack } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useExperts } from '../../contexts/expertsContext';
import { useColorMode } from '../../contexts/colorModeContext';
import { Heading } from '../UW/Heading';
import { Text } from '../UW/Text';

export const AddressPanel = () => {
  const { Moralis, isAuthenticated } = useMoralis();
  const { colorMode } = useColorMode();
  const { setDialog } = useExperts();
  // const { toSymbol, toAddress, txAmount } = useActions();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState('0x0');
  const user = Moralis.User.current();
  const ethAddress = user?.attributes.ethAddress;

  useEffect(() => {
    console.log('Called....');
    if (copied) {
      console.log('Copy Done');
      setDialog(
        'Your wallet address has been copied to the clipboard.  ' +
          'Paste your address as the destination ' +
          'in the market withdraw or send entry, ' +
          'then carefully check the address before sending!  ' +
          'Malware can change your destination address in the clipboard!'
      );
      setCopied(false);
    } else {
      if (isAuthenticated) {
        setData('ethereum:' + user?.attributes['ethAddress'] + '?chainID:137');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copied]);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        m: 'auto',
        mb: 3,
        borderRadius: '1.5rem',
        border: 4,
        backgroundImage: 'var(--bg)',
        borderColor: 'var(--borderColor)',
      }}
    >
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          px: 5,
          py: 2.5,
        }}
        spacing={6}
      >
        <Heading variant="h4">Your Address:</Heading>
        <QRCode value={ethAddress} />
        <Stack direction="row" spacing={1}>
          <Text sx={{ lineHeight: 2.5 }}>{ethAddress}</Text>
          <CopyToClipboard
            text={data}
            onCopy={(text, result) => setCopied(result)}
          >
            <ContentCopyIcon
              sx={{
                width: 'auto',
                borderColor: '#e2e8f0 !important',
                border: 1,
                borderRadius: '.3rem',
                alignSelf: 'center',
                boxShadow: 'var(--boxShadow)',
                color: colorMode === 'light' ? '#000000de' : '#ffffffeb',
                p: 1,
              }}
            />
          </CopyToClipboard>
        </Stack>
      </Stack>
    </Box>
  );
};
