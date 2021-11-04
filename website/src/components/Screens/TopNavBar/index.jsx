import { useMoralis } from 'react-moralis';

import { Box, Stack, Typography } from '@mui/material';
import { ExpertButton } from '../../Bits/ExpertButton';

import { LightSwitch } from '../../Bits/LightSwitch';
import { AuthButton } from '../../Bits/AuthButton';
import { ProfileAvatar } from '../../Bits/ProfileAvatar';
import { AddNetworkButton } from '../../Bits/AddNetworkButton';
import { OnBoardingButton } from '../../Bits/OnBoardingButton';

import './styles.css';
import USAWalletEagleLogo from '../../../media/logos/USAWalletLogo.svg';

export const TopNavBar = (props) => {
  const { isAuthenticated } = useMoralis();
  return (
    <Stack direction="row" sx={{ mt: 3, alignSelf: 'center' }} spacing={1}>
      <Box
        component="img"
        sx={{
          mr: 0.5,
          mt: 1,
          width: 70,
        }}
        alt="USA Wallet Logo"
        src={USAWalletEagleLogo}
      />
      <Typography className="BrandName">USA Wallet</Typography>
      {isAuthenticated && <ExpertButton />}
      <LightSwitch />
      {isAuthenticated && <AddNetworkButton />}
      <AuthButton />
      {isAuthenticated && <OnBoardingButton />}
      {isAuthenticated && <ProfileAvatar />}
    </Stack>
  );
};
