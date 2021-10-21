import * as React from 'react';
import { Skeleton } from '@mui/material';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useTransactions } from "../../hooks/useTransactions";

export const TransactionList = (props) => {
  const { Txs, isLoading } = useTransactions({ chain: "eth" });
  return (
        <Table size="small" aria-label="purchases">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="right">Transacted With</TableCell>
              <TableCell align="right">Amount</TableCell>
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
                    <TableCell>{Tx.timestamp.toLocaleDateString()}</TableCell>
                    <TableCell>{Tx.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell>{Tx.counterparty}</TableCell>
                    <TableCell>{(Tx.amount / 10 ** props.decimals).toPrecision(3)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
  );
}