import { IconButton, Tooltip } from "@mui/material";

import { useMoralis } from "react-moralis";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { useExperts } from "../../contexts/expertsContext";

const chainId = 137;
const chainName = "Polygon Mainnet";
const currencyName = "MATIC";
const currencySymbol = "MATIC";
const rpcUrl = "https://polygon-rpc.com/";
const blockExplorerUrl = "https://polygonscan.com/";

export const AddNetworkButton = (props) => {
  const { Moralis } = useMoralis();
  const { setDialog } = useExperts();

  const addPolygonNetwork = () => {
    Moralis.addNetwork(
      chainId,
      chainName,
      currencyName,
      currencySymbol,
      rpcUrl,
      blockExplorerUrl
    )
      .then(
        (success) => {
          if (typeof success == "undefined") {
            setDialog("Polygon Network added to Metamask successfully.");
            console.groupCollapsed("AddNetworkButton");
            console.log("success:", success);
            console.groupEnd();
          }
        },
        (error) => {
          setDialog("There is an error in adding Network, Please try again.");
          console.groupCollapsed("AddNetworkButton");
          console.log("Error:", error);
          console.groupEnd();
        }
      )
      .catch((error) => {
        setDialog("There is an error in adding Network, Please try again.");
        console.groupCollapsed("AddNetworkButton");
        console.log("CatchError:", error);
        console.groupEnd();
      });
  };

  return (
    <Tooltip title="Add Polygon Network to MetaMask">
      <IconButton
        aria-label="Add Polygon Network"
        sx={{ boxShadow: "var(--boxShadow)" }}
        variant="uw"
        onClick={addPolygonNetwork}
      >
        <AllInclusiveIcon className="nav-bar-icon" />
      </IconButton>
    </Tooltip>
  );
};
