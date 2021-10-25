import { Image } from "@chakra-ui/react";
import BadgeIcon from "../../media/characters/Benicorn.svg";
export const Benicorn = (props) => {
  return (
    <Image
      onClick={props.poke}
      height="200px"
      width="200px"
      transform="scale(1.5,1.5) translate(0px,22px)"
      src={BadgeIcon}
      alt="Benicorn"
    />
  );
};
