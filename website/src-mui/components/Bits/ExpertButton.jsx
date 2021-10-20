import { IconButton, Tooltip } from '@mui/material';

import ChatIcon from '@mui/icons-material/Chat';
import BlockIcon from '@mui/icons-material/Block';

import { useExperts } from "../../contexts/expertsContext";
import { useColorMode } from "../../contexts/colorModeContext";
import { useGradient } from "../../contexts/gradientsContext";



export const ExpertButton = () => {
  const { expertsOn, toggleExperts } = useExperts();
  const { colorMode } = useColorMode();
  const { darkBoxShadow } = useGradient();



  return (
    <Tooltip title="Toggle expert advice.">
      <IconButton
        aria-label={expertsOn ? "Mute Expert Advice" : "Enable Expert Advice"} 
        className="ExpertToggleButton"
        sx={{ 
          width:'auto', 
          height:'2.5rem',
          alignSelf: 'center',
          ml:1, 
          borderColor: '#e2e8f0 !important', 
          border:1, 
          borderRadius:'.3rem',
          boxShadow: darkBoxShadow
        }} 
        variant={colorMode === "light" ? "outlined" : "contained"}
        onClick={() => toggleExperts(!expertsOn)}>
        {expertsOn ? <BlockIcon /> : <ChatIcon />}
      </IconButton>
    </Tooltip>
    
  );
};
