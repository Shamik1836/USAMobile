
import { Typography } from '@mui/material';

export const Text = ({ variant='body1', ...props}) => {

  return (
      <Typography 
      	variant={variant}
      	sx={{
      		fontFamily:'P22-Typewriter',
          color: 'text.primary'
      	}}
      >
        {props.children}
      </Typography>    
  );
};
