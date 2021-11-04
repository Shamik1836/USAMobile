import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import { CopyAddress } from '../Bits/CopyAddress';
import { ActionPanel } from '../Blocks/ActionPanel';
import { useMoralis } from 'react-moralis';
import { TokenTable } from '../Blocks/TokenTable';

import WheatField from '../../media/Padding/wheatField.jpeg';

export const MainStage = () => {
  const { isAuthenticated, user } = useMoralis();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack spacing={9} sx={{ overflow: 'hidden' }}>
        <Typography>
          ----------<i>Main Stage</i>----------
        </Typography>
        {isAuthenticated ? (
          <>
            <Stack direction="row">
              {user !== null && (
                <Typography>
                  Ethereum address: {user?.attributes['ethAddress']}
                </Typography>
              )}
              <CopyAddress mode="copy" />
            </Stack>
            <ActionPanel />
            <TokenTable />
          </>
        ) : (
          <>
            <Box sx={{ height: 10 }} />
            <Box sx={{ borderRadius: 3, m: 2.5, overflow: 'hidden' }}>
              <img src={WheatField} alt="Amber Waves of Grain" />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};
