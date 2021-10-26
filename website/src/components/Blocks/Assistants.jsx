import { Box, Typography} from '@mui/material';

import { MetaMask } from "../Guides/MetaMask";
import { PayPal } from "../Guides/PayPal";
import { UniSwap } from "../Guides/UniSwap";
import { useExperts } from "../../contexts/expertsContext";

export const Assistants = () => {
  const { expertsOn, actionMode, dialog } = useExperts();

  if (expertsOn === true) {
    return (
      <Box sx={{m:3}}>
        <Box width="200px" sx={{m:3, p:3}}>
          <Typography>{dialog}</Typography>
        </Box>
        <Box>
          {actionMode === "swap" && <UniSwap />}
          {actionMode === "recieve" && <PayPal />}
          {actionMode === "invest" && <MetaMask />}
          {actionMode === "send" && <MetaMask />}
        </Box>
      </Box>
    );
  } else {
    return null;
  }
};
