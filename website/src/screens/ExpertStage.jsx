import { Container, HStack, Text, useColorMode } from "@chakra-ui/react";
import { MetaMask } from "../components/Guides/MetaMask";
import { PayPal } from "../components/Guides/PayPal";
import { UniSwap } from "../components/Guides/UniSwap";
import { useExperts } from "../contexts/expertsContext";

const lightModeBG = "linear(to-br,blue.400,red.300,white,red.300,white)";
const darkModeBG = "linear(to-br,blue.900,grey,red.900,grey,red.900)";

export const ExpertStage = () => {
  const { colorMode } = useColorMode();
  const { expertsOn, actionMode, dialog } = useExperts();

  if (expertsOn === true) {
    return (
      <Container>
        <HStack
          bgColor="black"
          borderColor="white"
          borderWidth="2"
          boxShadow="dark-lg"
          borderRadius="20px"
          m="20px"
          p="20px"
          width="400px"
          bgGradient={colorMode === "light" ? lightModeBG : darkModeBG}
        >
          <Container width="200px" margin={7} padding={3} text-align="center">
            <Text text-align="center">{dialog}</Text>
          </Container>
          <Container>
            {actionMode === "idle" && <UniSwap />}
            {actionMode === "portfolio" && <PayPal />}
            {actionMode === "buy" && <MetaMask />}
            {actionMode === "send" && <MetaMask />}
          </Container>
        </HStack>
        <br />
      </Container>
    );
  } else {
    return null;
  }
};
