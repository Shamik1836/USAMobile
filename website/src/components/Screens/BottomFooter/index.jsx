import { Stack, Box, Typography } from '@mui/material';
import { useMoralis } from 'react-moralis';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { faCheckSquare, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ByMoralis } from 'react-moralis';

import { useNetwork } from '../../../contexts/networkContext';

import './styles.css';
import ladyLib from '../../../media/Padding/LadyLiberty.jpg';
import installMetamask from '../../../media/Padding/InstallMetamask.png';
import addPolygon from '../../../media/Padding/AddPolygon.png';
import congratulations from '../../../media/Padding/Congratulations.png';

library.add(fab, faCheckSquare, faCoffee);

export const BottomFooter = () => {
  const { isAuthenticated } = useMoralis();
  const { hasPolygon } = useNetwork();

  const hasMetamask = window.ethereum?.isMetaMask;
  let image = ladyLib;
  if (isAuthenticated) {
    if (!hasMetamask) {
      image = installMetamask;
    } else if (!hasPolygon) {
      image = addPolygon;
    } else {
      image = congratulations;
    }
  }

  return (
    <Stack
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        m: 2.5,
        p: 2.5,
      }}
    >
      <Box component="img" sx={{ width: 400, borderRadius: 2.5 }} src={image} />
      <br />
      <br />
      <Stack direction="row">
        <ByMoralis scale="50" />
      </Stack>
      <Stack></Stack>
      <Stack sx={{ mt: 2 }}>
        <Typography>Join the Crypto Nation: </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <FontAwesomeIcon
          className="FAIcon"
          icon={['fab', 'discord']}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={['fab', 'facebook-square']}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={['fab', 'youtube-square']}
          size="2x"
          color="lightblue"
        />
        <FontAwesomeIcon
          className="FAIcon"
          icon={['fab', 'twitter-square']}
          size="2x"
          color="lightblue"
        />
      </Stack>
      {/*<Spacer />*/}
    </Stack>
  );
};
