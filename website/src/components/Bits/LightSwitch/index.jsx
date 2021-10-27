import { IconButton, Tooltip } from '@mui/material';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import Brightness5Icon from '@mui/icons-material/Brightness5';

import { useColorMode } from '../../../contexts/colorModeContext';

import "./styles.css";

export const LightSwitch = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Tooltip title={colorMode === "light" ? "Dark Mode" : "Light Mode"}>
      <IconButton
        aria-label="Toggle Darkmode"
        className="LightSwitchButton"
        sx={{boxShadow: "var(--boxShadow)" }} 
        variant="uw"
        onClick={toggleColorMode}>
        {colorMode === "light" ? <Brightness3Icon /> : <Brightness5Icon />}
      </IconButton>
    </Tooltip>

  );
};
