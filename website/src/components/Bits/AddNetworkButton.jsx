import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

import { usePolygonNetwork } from '../../hooks/usePolygonNetwork';
import { useExperts } from '../../contexts/expertsContext';

export const AddNetworkButton = () => {
  const { addPolygonNetwork } = usePolygonNetwork();
  const { setDialog } = useExperts();

  React.useEffect(() => {
    setDialog('Add Polygon Network to Metamask for discount transaction fees');
  }, [setDialog]);

  return (
    <Tooltip title="Add Polygon Network to MetaMask">
      <IconButton
        aria-label="Add Polygon Network"
        sx={{ boxShadow: 'var(--boxShadow)' }}
        variant="uw"
        onClick={addPolygonNetwork}
      >
        <AllInclusiveIcon className="nav-bar-icon" />
      </IconButton>
    </Tooltip>
  );
};
