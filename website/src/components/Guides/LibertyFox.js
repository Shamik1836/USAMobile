import { Box } from "@mui/material";
import IconBadge from "../../media/characters/LibertyFox.svg";
export const LibertyFox = (props) => {
  return (
    <Box
      component="img"
      sx={{
        mb: -2,
        height: 180,
        width: 180,
        transform: "scale(1.78,1.78) translate(5px,9px)",
      }}
      src={IconBadge}
      alt="Liberty Fox"
      onClick={props.poke}
    />
  );
};
