import { Image } from "@chakra-ui/react";
import BadgeIcon from "../../media/characters/LibertyFox.svg";
export const LibertyFox = (props) => {
  return (
    <Image
      onClick={props.poke}
      height="200px"
      width="200px"
      transform="scale(1.78,1.78) translate(5px,9px)"
      src={BadgeIcon}
      alt="Liberty Fox"
      marginBottom="-2vh"
    />
  );
};
