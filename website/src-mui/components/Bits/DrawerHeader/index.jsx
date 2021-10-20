import { Box, IconButton, Stack } from '@mui/material';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';


export const DrawerHeader = ({closeDrawer, children}) => {
  return (
    <Stack direction="row" sx={{justifyContent: 'space-between'}}>
      	<Box 
	      	sx={{ 
	      		typography: 'subtitle2',
	      		display:'flex',
	      		alignItems:'center',
	      		ml:2
	      	}}
    	>
        {children}
     	</Box>
      <IconButton
        aria-label="Close Drawer" 
        sx={{ mr:2 }} 
        onClick={closeDrawer}>
        <HighlightOffIcon />
      </IconButton>
    </Stack>
    
  );
};