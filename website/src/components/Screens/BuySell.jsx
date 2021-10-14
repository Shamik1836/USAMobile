import { useEffect } from "react";
// import { useMoralis } from "react-moralis";
import { useExperts } from "../../contexts/expertsContext";

export const BuySell = () => {
  // const { user } = useMoralis();
  const { setActionMode, setDialog } = useExperts();
  // const ethAddress = user?.attributes.ethAddress;

  useEffect(() => {
    setActionMode("buy");
    setDialog("Place an order to buy cryptocurrency.");
  }, []);

  return (
    <iframe
      src="https://global.transak.com/"
      title="transak"
      width="550px"
      height="650px"
    />
  );
};
