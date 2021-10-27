import { Box } from "@mui/material";
import BadgeIcon from "../../media/characters/Benicorn.svg";

export const Benicorn = (props) => {
  return (
    <Box
      component="img"
      sx={{
        height: 180,
        width: 180,
        transform: "scale(1.5,1.5) translate(0px,22px)",
      }}
      src={BadgeIcon}
      alt="Benicorn"
      onClick={props.poke}
    />
  );
};
