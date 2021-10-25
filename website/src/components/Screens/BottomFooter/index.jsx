import { Stack, Box, Typography } from "@mui/material";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faCheckSquare, faCoffee } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ByMoralis } from "react-moralis";

import "./styles.css";
import ladyLib from "../../../media/Padding/LadyLiberty.jpg";

library.add(fab, faCheckSquare, faCoffee);

export const BottomFooter = () => {
  return (
    <Stack 
    	sx={{
    		justifyContent:'center', 
    		alignItems:'center', 
    		m:2.5,
           p:2.5
       }}
    >
    	<Box
	      component="img"
	      sx={{ width: 400, borderRadius:2.5, }}
	      src={ladyLib}
	    />
      <br />
      <br />
      <Stack direction="row">
        <ByMoralis scale="50" />
      </Stack>
      <Stack></Stack>
      <Stack sx={{mt:2}}>
        <Typography>Join the Crypto Nation: </Typography>
      </Stack>
      <Stack direction="row" spacing={1}  sx={{mt:2}}>
        <FontAwesomeIcon
          className="FAIcon"
          icon={["fab", "discord"]}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={["fab", "facebook-square"]}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={["fab", "youtube-square"]}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={["fab", "twitter-square"]}
          size="2x"
          color="lightblue"
        />
      </Stack>
      {/*<Spacer />*/}
    </Stack>
  );
};
