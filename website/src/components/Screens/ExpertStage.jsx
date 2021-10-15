import { Container, HStack, Text, useColorMode } from "@chakra-ui/react";
import { LibertyFox } from "../Guides/LibertyFox";
import { SamEagle } from "../Guides/SamEagle";
import { Benicorn } from "../Guides/Benicorn";
import { useExperts } from "../../contexts/expertsContext";
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
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();
  const { expertsOn, actionMode, dialog } = useExperts();
  const Icon = Icons[actionMode];

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
          <Container padding={3} flex="1">
            <Text>{dialog}</Text>
          </Container>
          <Container flex="1">{Icon && <Icon />}</Container>
        </HStack>
        <br />
      </Container>
    );
  } else {
    return null;
  }
};
