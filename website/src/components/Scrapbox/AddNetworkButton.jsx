import { Button, Tooltip } from "@mui/material";

import { useMoralis } from "react-moralis";
import { useNetwork } from "../../contexts/networkContext";
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';


const chainId = 137;
const chainName = "Polygon Mainnet";
const currencyName = "MATIC";
const currencySymbol = "MATIC";
const rpcUrl = "https://polygon-rpc.com/";
const blockExplorerUrl = "https://polygonscan.com/";

export const AddNetworkButton = (props) => {
  const ethereum = window.ethereum;
  const { Moralis } = useMoralis();
  const { networkId, setNetworkId } = useNetwork();

  const addPolygonNetwork = () => {
    Moralis.addNetwork(chainId,chainName,currencyName,currencySymbol,rpcUrl,blockExplorerUrl)
    .then((success)=>{
      if(typeof success == 'undefined'){
        console.log('Success is undefined and network added already');
      }
    },(error)=>{
      console.log('Error:', error);
    })
    .catch(error=>{
      console.log('Error:', error);
    });
  }

  return (
    <Tooltip title='Add Polygon to MetaMask'>
      <Button
        variant="uw"
        sx={{ height: 40, alignSelf: 'center', boxShadow: "var(--boxShadow)" }}
        startIcon={<AllInclusiveIcon />}
        onClick={addPolygonNetwork}>
        Add Polygon
      </Button>
    </Tooltip>

  );
};


// Old Implementation
// import { Button } from "@mui/material";
// import { useMoralis } from "react-moralis";
// import { useNetwork } from "../../contexts/networkContext";


// export const AddNetworkButton = (props) => {
//   const ethereum = window.ethereum;
//   const { web3 } = useMoralis();
//   const { networkId, setNetworkId } = useNetwork();
//   const networkIDHex = web3.utils.toHex("137");

//   async function addPolygonNetwork() {
//     console.groupCollapsed("AddNetworkButton");
//     console.log(
//       "web3.utils.toHex(137) should be 13881: ",
//       web3.utils.toHex(80001)
//     );
//     console.log("networkIDHex:", networkIDHex);

//     if (networkId !== 137) {
//       try {
//         console.log("Attempting simple ethereum.request()...");
//         await ethereum.request({
//           method: "wallet_switchEthereumChain",
//           params: [{ chainId: networkIDHex }], // Hexadecimal version of 80001, prefixed with 0x
//         });
//         setNetworkId(137);
//       } catch (error) {
//         if (error.code === 4902) {
//           console.log("...failed.  attempting complex call...");
//           try {
//             await ethereum.request({
//               method: "wallet_addEthereumChain",
//               params: [
//                 {
//                   chainId: networkIDHex, // Hexadecimal version of 80001, prefixed with 0x
//                   chainName: "POLYGON Mainnet",
//                   nativeCurrency: {
//                     name: "MATIC",
//                     symbol: "MATIC",
//                     decimals: 18,
//                   },
//                   rpcUrls: [
//                     "https://speedy-nodes-nyc.moralis.io/b18bab00073ceeeeed714bf2/polygon/mainnet",
//                   ],
//                   blockExplorerUrls: ["https://explorer.matic.network//"],
//                   iconUrls: [""],
//                 },
//               ],
//             });
//             setNetworkId(137);
//           } catch (addError) {
//             console.log("Did not add network");
//           }
//         }
//       }
//     }
//     console.log("...process end.");
//     console.groupEnd();
//   }

//   return (
//     <Button
//     	sx={{mr:2, mt:2, boxShadow:"var(--boxShadow)"}}
//       	className="ExpertButton"
//       	variant="contained"
//       	onClick={addPolygonNetwork}
//     >
//       Add Polygon
//     </Button>
//   );
// };

//  // visible={window.ethereum.chainId === networkIDHex ? "hidden" : "visible"}

