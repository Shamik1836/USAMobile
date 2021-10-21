import { Box, Stack } from '@mui/material';
import { useActions } from "../../contexts/actionsContext";

import { useColorMode } from '../../contexts/colorModeContext';
import { useGradient } from "../../contexts/gradientsContext";


import { FromSelect } from "../Bits/FromSelect";
import { AmountSelect } from "../Bits/AmountSelect";
import { StartSend } from "../Bits/StartSend";

// Send mode.
import { ToAddress } from "../Bits/ToAddress";


export const SendPanel = () => {
  const { txAmount, fromSymbol, toAddress } = useActions();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient(); //darkBoxShadow

 
  return (
    <Box
      sx={{ 
        display: 'inline-flex', minWidth: 420, maxWidth:660, m: 'auto',
        borderRadius: '1.5rem',
        borderWidth: 2,
        backgroundImage: (colorMode === 'light' ? lightModeBG : darkModeBG)
      }}
    >
    <Stack sx={{alignItems: 'center', justifyContent: 'center', px: 5, py: 2.5}} spacing={3}>
      <FromSelect />
      {!!fromSymbol && (
        <Stack>
          <Stack direction='row' spacing={1}>
            <AmountSelect />
            {txAmount && 
              <ToAddress/>
            }
          </Stack>
          {toAddress && <StartSend />}
        </Stack>
      )}
      <br />
    </Stack>
    </Box>
  );
};
