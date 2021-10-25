import { Button, Stack, Tooltip, Typography } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import LoopIcon from '@mui/icons-material/Loop';
import RestoreIcon from '@mui/icons-material/Restore';


import { useExperts } from "../../contexts/expertsContext";
import { useGradient } from "../../contexts/gradientsContext";

import { CopyAddress } from "../Bits/CopyAddress";


export const ModeSelect = () => {
  const { setActionMode, setDialog } = useExperts();
  const { darkBoxShadow } = useGradient();

  return (
    <>
      <Typography>Select an Action:</Typography>
      <Stack direction="row">
        <Tooltip title="Swap some of one token for another token.">
          <Button
            endIcon={<LoopIcon />}
            variant="contained"
        	sx={{ boxShadow:darkBoxShadow}}
            boxShadow="dark-lg"
            onClick={() => {
              setActionMode("swap");
              setDialog('"Select a token to receive from the pull-down menu."');
            }}
          >
            Swap
          </Button>
        </Tooltip>
        <Tooltip  title="Send some of this token to an address.">
          <Button
            endIcon={<EmailIcon />}
            variant="contained"
        	sx={{ boxShadow:darkBoxShadow}}
            onClick={() => {
              setActionMode("send");
              setDialog('"Enter the destination Ethereum address."');
            }}
          >
            Send
          </Button>
        </Tooltip>
        <Tooltip  title="Ask about our Crypto Patriot program.">
          <Button
            endIcon={<RestoreIcon />}
            variant="contained"
        	sx={{ boxShadow:darkBoxShadow}}
            onClick={() => {
              setActionMode("invest");
              setDialog("Ask about our CRYPTO PATRIOTS program, coming soon!");
            }}
          >
            Invest
          </Button>
        </Tooltip>
        <CopyAddress mode="receive" />
      </Stack>
    </>
  );
};
