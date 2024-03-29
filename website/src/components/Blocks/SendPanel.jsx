import { Box, Stack } from '@mui/material';

import { useActions } from '../../contexts/actionsContext';
import { FromSelect } from '../Bits/FromSelect';
import { AmountSelect } from '../Bits/AmountSelect';
import { StartSend } from '../Bits/StartSend';
// Send mode.
import { ToAddress } from '../Bits/ToAddress';

export const SendPanel = () => {
  const { fromToken } = useActions();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        minWidth: 420,
        maxWidth: 660,
        m: 'auto',
        borderRadius: '1.5rem',
        border: 4,
        backgroundImage: 'var(--bg)',
        borderColor: 'var(--borderColor)',
      }}
    >
      <Stack
        sx={{
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: 5,
          py: 2.5,
        }}
        spacing={3}
      >
        <FromSelect />
        {!!fromToken && (
          <>
            <AmountSelect type="send" />
            <ToAddress />
            <Stack sx={{ alignSelf: 'center' }} direction="row" spacing={1}>
              <StartSend />
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
};
