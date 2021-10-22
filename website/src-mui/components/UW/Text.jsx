
import { Typography } from '@mui/material';
import { useColorMode } from '../../contexts/colorModeContext';

export const Text = ({ variant='body1', ...props}) => {
  const { colorMode } = useColorMode();

  return (
      <Typography 
      	variant={variant}
      	sx={{
      		color:(colorMode === 'light' ? '#000000de' : '#ffffffeb'),
      		fontFamily:'P22-Typewriter',
      	}}
      >
        {props.children}
      </Typography>    
  );
};
