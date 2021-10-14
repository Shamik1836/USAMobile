import { useEffect } from "react";
import { useExperts } from "../../contexts/expertsContext";

export const BuySell = () => {
  const { setActionMode, setDialog } = useExperts();

  useEffect(() => {
    setActionMode("buy");
    setDialog("Place an order to buy cryptocurrency.");
  }, [setActionMode, setDialog]);

  return (
    <iframe
      src="https://global.transak.com/"
      title="transak"
      width="550px"
      height="650px"
    />
  );
};
