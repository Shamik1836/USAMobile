import { Box, Image, HStack, Text, useColorMode } from "@chakra-ui/react";

import { ExpertButton } from "../Bits/ExpertButton";
import { LightSwitch } from "../Bits/LightSwitch";
import { AuthButton } from "../Bits/AuthButton";
import { ProfileAvatar } from "../Bits/ProfileAvatar";
import { useMoralis } from "react-moralis";
import "./TopNavBar.css";

import USAWalletEagleLogo from "../../media/logos/USAWalletLogo.svg";

export const TopNavBar = (props) => {
  const { isAuthenticated } = useMoralis();
  const colorMode = useColorMode();
  return (
    <HStack>
      <Box boxSize="70px">
        <Image
          name="USAWalletEagle"
          src={USAWalletEagleLogo}
          bg={colorMode === "light" ? "white" : "grey.900"}
          mr={1}
          mt={2}
          boxShadow="light-lg"
        />
      </Box>
      <Text
        className="BrandName"
        fontSize="5xl"
        bgGradient="linear(to-b,white,#0000FF,black)"
        bgClip="text"
        boxShadow="light-lg"
        mt={1}
      >
        USA Wallet
      </Text>
      {isAuthenticated && <ExpertButton />}
      {/* <NetworkSelect /> */}
      <LightSwitch />
      <AuthButton />
      {isAuthenticated && <ProfileAvatar />}
    </HStack>
  );
};
