import { Image } from "@chakra-ui/react";
import BadgeIcon from "../../media/characters/Sameagle.svg";
export const SamEagle = (props) => {
  return (
    <Image
      height="200px"
      width="200px"
      transform="scale(1.75,1.75) translate(32px,35px)"
      src={BadgeIcon}
      alt="Uncle Sam Eagle"
    />
  );
};
