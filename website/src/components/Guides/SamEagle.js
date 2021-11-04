import { Box } from '@mui/material';

import BadgeIcon from '../../media/characters/SamEagle.svg';
export const SamEagle = (props) => {
  return (
    <Box
      component="img"
      sx={{
        height: 180,
        width: 180,
        transform: 'scale(1.75,1.75) translate(32px,35px)',
      }}
      src={BadgeIcon}
      alt="Uncle Sam Eagle"
    />
  );
};
