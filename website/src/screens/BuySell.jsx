import { useEffect } from "react";
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
    ></div>
  );
};
