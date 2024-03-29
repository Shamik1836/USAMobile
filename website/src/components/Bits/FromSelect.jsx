import { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { usePositions } from '../../hooks/usePositions';
import { useActions } from '../../contexts/actionsContext';
import { useExperts } from '../../contexts/expertsContext';
import { useNetwork } from '../../contexts/networkContext';

// import { useMoralis } from "react-moralis";

export const FromSelect = () => {
  const [value, setValue] = useState('');
  const { positions, waiting } = usePositions();
  const { setFromToken, setToToken } = useActions();
  const { setDialog } = useExperts();
  const { networkId } = useNetwork();

  useEffect(() => {
    return () => {
      setFromToken();
    };
  }, [setFromToken]);

  const handleChange = async (e) => {
    const position = e.target.value;
    setValue(position);

    if (networkId !== 137) {
      setFromToken();
      setToToken();
      setDialog('Switch network to Polygon');
      return;
    }

    if (position) {
      setFromToken(position);
      setDialog(
        "Use the 'Select amount' to set how much " +
          position.symbol +
          ' to use in this action. '
      );
    } else {
      setFromToken();
      setToToken();
      setDialog(
        "Use the 'Select a token to act with' menu " +
          'to start creating an action plan.'
      );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <FormControl
        sx={
          {
            // boxShadow: "var(--boxShadow)"
          }
        }
        id="swapfrom"
        fullWidth
      >
        <InputLabel id="form-select-label">
          Select a token to act with.
        </InputLabel>
        <Select
          id="fromToken"
          label="Select a token to act with."
          sx={{
            minWidth: 340,
            //boxShadow: "var(--boxShadow)"
          }}
          onChange={handleChange}
          value={value}
        >
          {!waiting &&
            positions.map((position) => {
              return (
                <MenuItem key={position.symbol} value={position}>
                  From {position.tokens && position.tokens.toPrecision(3)}{' '}
                  {position.name} @ $
                  {position.price && position.price.toFixed(2)}/
                  {position.symbol && position.symbol.toUpperCase()} = $
                  {position?.value.toFixed(2)}
                </MenuItem>
              );
            })}
        </Select>
      </FormControl>
    </Box>
  );
};
