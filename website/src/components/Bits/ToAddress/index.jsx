import { useEffect } from "react";
import { Box, TextField } from '@mui/material';
import { useMoralis } from "react-moralis";
import ENSAddress from "@ensdomains/react-ens-address";

import { useActions } from "../../../contexts/actionsContext";
import { useNetwork } from "../../../contexts/networkContext";

import "./styles.scss";

export const ToAddress = () => {
  const { web3, enableWeb3, isWeb3Enabled } = useMoralis();
  const { setToToken } = useActions();
  const { networkId } = useNetwork();

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
  }, [isWeb3Enabled, enableWeb3]);

  useEffect(() => {
    return () => {
      setToToken();
    };
  }, [setToToken]);

  return (
    <Box  sx={{ minWidth:420}} className="to-address">
      {isWeb3Enabled && networkId === 1 && (
        <ENSAddress
          provider={web3.givenProvider || web3.currentProvider}
          onResolve={({ name, address, type }) => {
            if (
              type &&
              address !== undefined &&
              address !== "0x0000000000000000000000000000000000000000"
            ) {
              setToToken({
                symbol: name,
                address,
              });
              console.groupCollapsed("ToAddress");
              console.log("ENS Resolved To:", {
                name: name,
                address: address,
                type: type,
              });
              console.groupEnd();
            }
          }}
        />
      )}
      {networkId !== 1 && (
        <TextField
          id="outlined-basic"
          label="Input destination address"
          type="text"
          variant="outlined"
          sx={{width:'100%'}}
          onChange={(event) => {
            setToToken({ symbol: "", address: event.target.value });
          }}
        />
      )}
    </Box>
  );
};