import { useEffect } from "react";
import { Box } from '@mui/material';
import { useMoralis } from "react-moralis";
import ENSAddress from "@ensdomains/react-ens-address";
import { useActions } from "../../../contexts/actionsContext";
import "./styles.css";

export const ToAddress = () => {
  const { web3, enableWeb3, isWeb3Enabled } = useMoralis();
  const { setToSymbol, setToAddress, setToENSType } = useActions();

  useEffect(() => {
    if (!isWeb3Enabled) {
      enableWeb3();
    }
  }, [isWeb3Enabled, enableWeb3]);

  return (
    <Box  sx={{ minWidth:420}}>
      {isWeb3Enabled && (
        <ENSAddress
          provider={web3.givenProvider || web3.currentProvider}
          onResolve={({ name, address, type }) => {
            if (
              type &&
              address !== undefined &&
              address !== "0x0000000000000000000000000000000000000000"
            ) {
              setToSymbol(name);
              setToAddress(address);
              setToENSType(type);
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
    </Box>
  );
};


// import { Stack, FormControl, TextField} from '@mui/material';

// import { useActions } from "../../contexts/actionsContext";
// const darkLgShadow = 'rgba(0, 0, 0, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 5px 10px 0px, rgba(0, 0, 0, 0.4) 0px 15px 40px 0px';


// // import { FormErrorMessage } from "@chakra-ui/react";

// export const ToAddress = () => {
//   const { fromSymbol, setToSymbol, toAddress, setToAddress } = useActions();
//   console.groupCollapsed("ToAddress");
//   console.groupEnd();

//   const handleChange = (e) => {
//     console.log('E:', e);
//     // setToSymbol(fromSymbol);
//     // setToAddress(e.target.value);
//     // console.groupCollapsed("ToAddress");
//     // console.log("Set toAddress:", toAddress);
//     // console.groupEnd();
//   };

//   return (
//     <Stack width="100%">
//       <FormControl id="toAddress">
//         <TextField
//           variant="outlined"
//           type="text"
//           label="Enter recipiant address"
//           sx={{ boxShadow: darkLgShadow }}
//           onChange={handleChange}
//         />

//         {/*<FormErrorMessage>Please enter a valid address.</FormErrorMessage>*/}
//       </FormControl>
//     </Stack>
//   );
// };
