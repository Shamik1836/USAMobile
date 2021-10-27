import { Box, Stack } from "@mui/material";

import { LibertyFox } from "../Guides/LibertyFox";
import { SamEagle } from "../Guides/SamEagle";
import { Benicorn } from "../Guides/Benicorn";
import { useExperts } from "../../contexts/expertsContext";

import { Text } from '../UW/Text';


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
            boxShadow: "var(--boxShadow)",
            backgroundImage: "var(--bg)",
          }}
        >
          <Box sx={{ display: 'flex', flex:1, alignSelf:'center', p: 1.5 }}>
            <Text>
              {dialog}
            </Text>
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


