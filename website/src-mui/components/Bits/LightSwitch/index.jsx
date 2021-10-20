import { IconButton, Tooltip } from '@mui/material';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import Brightness5Icon from '@mui/icons-material/Brightness5';

import { useColorMode } from '../../../contexts/colorModeContext';
import "./styles.css";

export const LightSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Tooltip title={colorMode === "light" ? "Dark Mode" : "Light Mode"}>
      <IconButton
        aria-label="Toggle Darkmode"
        className="LightSwitchButton"
        sx={{ 
        	width:'auto', 
        	height:'2.5rem',
        	alignSelf: 'center',
        	borderColor: '#e2e8f0 !important', 
        	border:1, 
        	borderRadius:'.3rem'
        }} 
        variant={colorMode === "light" ? "outlined" : "contained"}
        onClick={toggleColorMode}>
        {colorMode === "light" ? <Brightness3Icon /> : <Brightness5Icon />}
      </IconButton>
    </Tooltip>

  );
};


 // return(
 //    <UWIconButton 
 //      toolTipTitle={colorMode === "light" ? "Dark Mode" : "Light Mode"}
 //      label="Toggle Darkmode"
 //      onClick={toggleColorMode}>
 //      {colorMode === "light" ? <Brightness3Icon /> : <Brightness5Icon />}
 //    </UWIconButton>
 //  );