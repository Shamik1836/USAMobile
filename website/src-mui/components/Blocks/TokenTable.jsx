import * as React from 'react';
import { Avatar, Box, Collapse, IconButton, Typography, Paper, Stack } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


import { usePositions } from "../../hooks/usePositions";
import { TransactionList } from "./TransactionList";
import { useTransactions } from "../../hooks/useTransactions";

import { useColorMode } from '../../contexts/colorModeContext';
import { useGradient } from "../../contexts/gradientsContext";

// import Card from "../Research/card";
// import Loader from "../Research/load";


export const TokenTable = () => {
  const { colorMode } = useColorMode();
  const { lightModeBG, darkModeBG } = useGradient();

  const { positions, isLoading, totalValue } = usePositions();
  // const getDataApi = getDataByCoinID();
  // const handleClickRow = async (p) => {
  //   onOpen();
  //   const data = await getDataApi(p.id);
  //   if (data.id) {
  //     setSelectedCoin(data);
  //   } else {
  //     onClose();
  //   }
  // };

  function Position(props) {
    const { position } = props;
    const [open, setOpen] = React.useState(false);
    return (
      <React.Fragment>
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
          <TableCell component="th" scope="row">
            <Avatar
              name={position.symbol}
              src={position.image}
              size="sm"
            />
          </TableCell>
          <TableCell align="right">
            <Typography ml={2}>
              {position.name}
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography ml={2}>
              {position.tokens.toPrecision(3)}
            </Typography>

          </TableCell>
          <TableCell align="right">
            <Typography ml={2}>
              @ ${position.price && position.price.toFixed(2)}/
              {position.symbol && position.symbol.toUpperCase()}
            </Typography>

          </TableCell>
          <TableCell align="right">
            <Typography ml={2}>
              {" "}
              = ${position.value.toFixed(2)}
            </Typography>

          </TableCell>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  History
                </Typography>
                {position.name === "Ether" && (
                  <TransactionList chain="eth" decimals={position.decimals} />
                )}
              </Box>
            </Collapse>
          </TableCell>

        </TableRow>
      </React.Fragment>
    );
  }



  return (
   <Box sx={{ display: 'inline-flex', minWidth: 560, maxWidth:600, m:'auto'}}>
      <TableContainer component={Paper} sx={{ borderRadius: '1.5rem',borderWidth: 4}}>
        <Table aria-label="collapsible table" sx={{backgroundImage: (colorMode === 'light' ? lightModeBG : darkModeBG)}}>
          <TableHead>
            <TableRow>
             <TableCell align="center" colSpan={6}>
              {!isLoading && (
                <Typography>Total Value: ${parseFloat(totalValue).toFixed(2)}</Typography>
              )}  
              </TableCell>
            </TableRow>
            
          </TableHead>
          <TableBody>
            {!isLoading &&
              positions.map((position) => (
                <Position key={position.name} position={position} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

}
