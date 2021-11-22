import { useMoralis } from 'react-moralis';

import { Box, Stack, Typography } from '@mui/material';
import { ExpertButton } from '../../Bits/ExpertButton';

import { LightSwitch } from '../../Bits/LightSwitch';
import { AuthButton } from '../../Bits/AuthButton';
import { ProfileAvatar } from '../../Bits/ProfileAvatar';
import { AddNetworkButton } from '../../Bits/AddNetworkButton';
import { OnBoardingButton } from '../../Bits/OnBoardingButton';
import { useNetwork } from '../../../contexts/networkContext';

import './styles.css';
import USAWalletEagleLogo from '../../../media/logos/USAWalletLogo.svg';

export const TopNavBar = () => {
  const { isAuthenticated } = useMoralis();
  const hasMetamask = window.ethereum?.isMetaMask;
  const { isPolygon, hasPolygon } = useNetwork();

  return (
    <Box
      sx={{
        mt: 3,
        textAlign: 'center',
        display: isAuthenticated && !hasMetamask ? 'block' : 'flex',
        justifyContent: 'center',
      }}
    >
      <Stack direction="row" spacing={1} style={{ display: 'inline-flex' }}>
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
      </Stack>
      {isAuthenticated && !hasMetamask && <br />}
      <Stack direction="row" spacing={1} style={{ display: 'inline-flex' }}>
        {isAuthenticated && hasPolygon && <ExpertButton />}
        <LightSwitch />
        {isAuthenticated && hasMetamask && !hasPolygon && <AddNetworkButton />}
        <AuthButton />
        {isAuthenticated && <OnBoardingButton />}
        {isAuthenticated && <ProfileAvatar />}
      </Stack>
    </Box>
  );
};
