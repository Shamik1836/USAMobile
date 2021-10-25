import { IconButton, Tooltip, useColorMode } from "@chakra-ui/react";
import { NotAllowedIcon, ChatIcon } from "@chakra-ui/icons";
import { useExperts } from "../../contexts/expertsContext";

export const ExpertButton = () => {
  const { expertsOn, toggleExperts } = useExperts();
  const { colorMode } = useColorMode();

  return (
    <Tooltip label="Toggle expert advice.">
      <IconButton
        aria-label={expertsOn ? "Mute Expert Advice" : "Enable Expert Advice"}
        icon={expertsOn ? <NotAllowedIcon /> : <ChatIcon />}
        boxShadow="dark-lg"
        mr={2}
        mt={-2}
        variant={colorMode === "light" ? "outline" : "solid"}
        onClick={() => toggleExperts(!expertsOn)}
      />
    </Tooltip>
  );
};
