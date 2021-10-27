import { IconButton, Tooltip } from '@mui/material';

import ChatIcon from '@mui/icons-material/Chat';
import BlockIcon from '@mui/icons-material/Block';

import { useExperts } from "../../contexts/expertsContext";



export const ExpertButton = () => {
  const { expertsOn, toggleExperts } = useExperts();



  return (
    <Tooltip title="Toggle expert advice.">
      <IconButton
        aria-label={expertsOn ? "Mute Expert Advice" : "Enable Expert Advice"} 
        className="ExpertToggleButton"
        sx={{ ml:1,boxShadow: "var(--boxShadow)" }} 
        variant="uw"
        onClick={() => toggleExperts(!expertsOn)}>
        {expertsOn ? <BlockIcon className="nav-bar-icon" /> : <ChatIcon className="nav-bar-icon" />}
      </IconButton>
    </Tooltip>
    
  );
};
