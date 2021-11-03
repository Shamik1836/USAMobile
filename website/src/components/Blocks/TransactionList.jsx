import { useEffect, useState } from "react";
import { Skeleton } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTransactions } from "../../hooks/useTransactions";
import { useTokenTransfers } from "../../hooks/useTokenTransfers";

import "./styles.css";

const emptyList = [
  { timestamp: null, counterparty: "No transactions found.", amount: null },
];

export const TransactionList = (props) => {
  const { NativeTxs, NativeIsLoading } = useTransactions({
    chain: props.chain,
  });
  const { ERC20Txs, ERC20IsLoading } = useTokenTransfers({
    chain: props.chain,
    tokenAddress: props.tokenAddress,
  });
  const [Txs, setTxs] = useState(emptyList);
  const [isLoading, setIsLoading] = useState(1);

  console.groupCollapsed("TransactionList");
  console.log("props:", props);
  console.groupEnd();

  useEffect(() => {
    if (props.tokenAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      setTxs(ERC20Txs);
      setIsLoading(ERC20IsLoading);
    } else {
      setTxs(NativeTxs);
      setIsLoading(NativeIsLoading);
    }
  }, [
    ERC20IsLoading,
    ERC20Txs,
    NativeIsLoading,
    NativeTxs,
    props.tokenAddress,
  ]);

  return (
    <Table size="small" aria-label="purchases">
      <TableHead>
        <TableRow>
          <TableCell className="tx-header-title" align="center">
            Date
          </TableCell>
          <TableCell className="tx-header-title" align="center">
            Time
          </TableCell>
          <TableCell className="tx-header-title" align="center">
            Transacted With
          </TableCell>
          <TableCell className="tx-header-title" align="center">
            Amount
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow key="loadingTransactionHistory">
            <TableCell>
              <Skeleton variant="text" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" />
            </TableCell>
          </TableRow>
        ) : (
          Txs?.map((Tx) => {
            Tx.timestamp = new Date(Tx.block_timestamp);
            return (
              <TableRow key={Tx.timestamp}>
                <TableCell align="center">
                  {Tx.timestamp.toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  {Tx.timestamp.toLocaleTimeString()}
                </TableCell>
                <TableCell align="center">{Tx.counterparty}</TableCell>
                <TableCell align="center">
                  {(Tx.amount / 10 ** props.decimals).toPrecision(3)}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
