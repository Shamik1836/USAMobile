
import { Typography } from '@mui/material';

import { useColorMode } from '../../contexts/colorModeContext';

export const Heading = ({ variant='h4', ...props}) => {
  const { colorMode } = useColorMode();

  

  return (
      <Typography 
      	variant={variant}
      	sx={{
      		fontWeight: 700,
      		color:(colorMode === 'light' ? '#000000de' : 'white'),
      		fontSize:'2.25rem'
      	}}
      >
        {props.children}
      </Typography>    
  );
};
