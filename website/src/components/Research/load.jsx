import React from 'react';
import { Container, Box } from '@mui/material';

import LoadIcon from '../../media/load.gif';
import './research.css';
const Loader = () => (
  <Container
    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    className="load-content"
  >
    <Box
      component="img"
      sx={{ height: 100, width: 100 }}
      src={LoadIcon}
      alt="Load Icon"
    />
  </Container>
);

export default Loader;
