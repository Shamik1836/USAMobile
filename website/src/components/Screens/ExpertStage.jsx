import { Container, HStack, Text, useColorMode } from "@chakra-ui/react";
import { LibertyFox } from "../Guides/LibertyFox";
import { SamEagle } from "../Guides/SamEagle";
import { Benicorn } from "../Guides/Benicorn";
import { useExperts } from "../../contexts/expertsContext";
import { useGradient } from "../../contexts/gradientsContext";

export const ExpertStage = () => {
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();
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
            {actionMode === "" && <Benicorn />}
            {actionMode === "idle" && <Benicorn />}
            {actionMode === "portfolio" && <SamEagle />}
            {actionMode === "chart" && <SamEagle />}
            {actionMode === "trade" && <Benicorn />}
            {actionMode === "swap" && <Benicorn />}
            {actionMode === "buy" && <LibertyFox />}
            {actionMode === "sell" && <LibertyFox />}
            {actionMode === "send" && <LibertyFox />}
            {actionMode === "receive" && <LibertyFox />}
            {actionMode === "gallery" && <LibertyFox />}
          </Container>
        </HStack>
        <br />
      </Container>
    );
  } else {
    return null;
  }
};
