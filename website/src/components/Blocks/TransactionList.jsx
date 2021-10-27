import * as React from 'react';
import { Skeleton } from '@mui/material';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useTransactions } from "../../hooks/useTransactions";

import "./styles.scss";

export const TransactionList = (props) => {
  const { Txs, isLoading } = useTransactions({ chain: "eth" });
  return (
        <Table size="small" aria-label="purchases">
          <TableHead>
            <TableRow>
              <TableCell className="tx-header-title" align="center">Date</TableCell>
              <TableCell className="tx-header-title" align="center">Time</TableCell>
              <TableCell className="tx-header-title" align="center">Transacted With</TableCell>
              <TableCell className="tx-header-title" align="center">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
                <TableRow key="loadingTransactionHistory">
                 <TableCell><Skeleton variant="text" /></TableCell>
                 <TableCell><Skeleton variant="text" /></TableCell>
                 <TableCell><Skeleton variant="text" /></TableCell>
                 <TableCell><Skeleton variant="text" /></TableCell>
                </TableRow>
            ) : (

              Txs?.map((Tx) => {
                Tx.timestamp = new Date(Tx.block_timestamp);
                return (
                  <TableRow key={Tx.hash}>
                    <TableCell align="center">{Tx.timestamp.toLocaleDateString()}</TableCell>
                    <TableCell align="center">{Tx.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell align="center">{Tx.counterparty}</TableCell>
                    <TableCell align="center">{(Tx.amount / 10 ** props.decimals).toPrecision(3)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
  );
}