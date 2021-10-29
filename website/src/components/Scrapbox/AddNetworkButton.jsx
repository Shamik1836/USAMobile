import { IconButton, Tooltip } from "@mui/material";

import { useMoralis } from "react-moralis";
import { useNetwork } from "../../contexts/networkContext";
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { useExperts } from "../../contexts/expertsContext";


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
  const { setDialog } = useExperts();

  const addPolygonNetwork = () => {
    Moralis.addNetwork(chainId,chainName,currencyName,currencySymbol,rpcUrl,blockExplorerUrl)
    .then((success)=>{
      if(typeof success == 'undefined'){
        //TODO: 
        // This can be change If I can get a proper solution, that give me list of all Networks
        // And I can check Polygon already there or not.
        // For Now I am just showing, If results is undefined we can show already added, 
        // because it only returns undefined when already added.
        console.log('AddPolygoneSuccess:', success);
        console.log('Success is undefined means network added already, I am searching If I can get a better result for existing network.');
        setDialog("Polygon Network added to Metamask successfully.");
      }
    },(error)=>{
      console.log('Error:', error);
      setDialog("There is an error in adding Network, Please try again.");
    })
    .catch(error=>{
      console.log('CatchError:', error);
      setDialog("There is an error in adding Network, Please try again.");
    });
  }

  return (
    <Tooltip title="Add Polygon Network to MetaMask">
      <IconButton
        aria-label="Add Polygon Network"
        sx={{boxShadow: "var(--boxShadow)" }} 
        variant="uw"
        onClick={addPolygonNetwork}>
          <AllInclusiveIcon className="nav-bar-icon" />
      </IconButton>
    </Tooltip>

  );
};
