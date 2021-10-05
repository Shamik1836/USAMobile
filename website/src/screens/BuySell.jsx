import { useEffect } from "react";
import OnramperWidget from "@onramper/widget";
import { useColorMode } from "@chakra-ui/react";
import { useMoralis } from "react-moralis";
import { useExperts } from "../contexts/expertsContext";

export const BuySell = () => {
  const { colorMode } = useColorMode();
  const { user } = useMoralis();
  const { setActionMode, setDialog } = useExperts();
  const ethAddress = user?.attributes.ethAddress;

  useEffect(() => {
    setActionMode("buy");
    setDialog("Place an order to buy cryptocurrency.");
  });

  return (
    <div
      style={{
        width: "440px",
        height: "595px",
        boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        margin: "auto",
      }}
    >
      <OnramperWidget
        defaultAddrs={{
          ETH: { address: { ethAddress } },
        }}
        defaultCrypto={"USDC"}
        defaultAmount={500}
        API_KEY="pk_test_ass3gtLSWQpI11IWUZLJdrfyQhj7bTw_3xwLvhEvH6Q0"
        filters={
          {
            // onlyCryptos: ["USDC"],
          }
        }
        color={colorMode === "light" ? "#e89999" : "#720a0a"}
        fontFamily={"typewriter"}
      />
    </div>
  );
};
