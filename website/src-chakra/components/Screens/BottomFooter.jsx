import { HStack, Image, Spacer, Text, VStack } from "@chakra-ui/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faCheckSquare, faCoffee } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ByMoralis } from "react-moralis";
import "./BottomFooter.css";
import ladyLib from "../../media/Padding/LadyLiberty.jpg";

library.add(fab, faCheckSquare, faCoffee);

export const BottomFooter = () => {
  return (
    <VStack justifyContent="center">
      <Image
        src={ladyLib}
        width="400px"
        borderRadius="20px"
        boxShadow="light-lg"
      />
      <br />
      <br />
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
