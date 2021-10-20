import { Box, Stack, Typography } from "@mui/material";

import { LibertyFox } from "../Guides/LibertyFox";
import { SamEagle } from "../Guides/SamEagle";
import { Benicorn } from "../Guides/Benicorn";
import { useExperts } from "../../contexts/expertsContext";
import { useColorMode } from "../../contexts/colorModeContext";
import { useGradient } from "../../contexts/gradientsContext";


const Icons = {
  "": Benicorn,
  idle: Benicorn,
  portfolio: SamEagle,
  chart: SamEagle,
  trade: Benicorn,
  swap: Benicorn,
  buy: LibertyFox,
  sell: LibertyFox,
  send: LibertyFox,
  receive: LibertyFox,
  gallery: LibertyFox,
};


export const ExpertStage = () => {
  const { expertsOn, actionMode, dialog } = useExperts();
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG, darkBoxShadow} = useGradient();
  const Icon = Icons[actionMode];


  if (expertsOn === true) {
    return (

      <Box sx={{alignSelf:'center', px:2}}>
        <Stack direction="row"
          spacing={1}
          sx={{
            borderColor: "white",
            borderWidth: 2,
            borderRadius: 5,
            m: 2.5,
            p: 2.5,
            width: 400,
            boxShadow: darkBoxShadow,
            backgroundImage: (colorMode === 'light' ? lightModeBG : darkModeBG),
          }}
        >
          <Box sx={{ display: 'flex', flex:1, alignSelf:'center', p: 1.5 }}>
            <Typography>
              {dialog}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flex: 1, alignSelf:'center', px:2 }}>
           {Icon && <Icon />}
          </Box>
        </Stack>
        <br />
      </Box>
    );
  } else {
    return null;
  }
};


