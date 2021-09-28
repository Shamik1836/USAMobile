import { HStack, Spacer, Text, VStack } from "@chakra-ui/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faCheckSquare, faCoffee } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ByMoralis } from "react-moralis";
import "./BottomFooter.css";

library.add(fab, faCheckSquare, faCoffee);

export const BottomFooter = () => {
  return (
    <VStack justifyContent="center">
      <HStack>
        <ByMoralis scale="50" />
      </HStack>
      <HStack></HStack>
      <HStack>
        <Text>Join the Crypto Nation: </Text>
      </HStack>
      <HStack>
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
      </HStack>
      <Spacer />
    </VStack>
  );
};
