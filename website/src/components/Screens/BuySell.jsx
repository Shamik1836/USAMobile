import { useEffect, memo } from "react";
import { useMoralis } from "react-moralis";
import transakSDK from "@transak/transak-sdk";

import { useExperts } from "../../contexts/expertsContext";

export const BuySell = memo(() => {
  const { setActionMode, setDialog } = useExperts();
  const { Moralis } = useMoralis();
  const user = Moralis.User.current();
  const ethAddress = user?.attributes.ethAddress;
  const emailAddress = user?.attributes.emailAddress;

  useEffect(() => {
    if (ethAddress) {
      const transak = new transakSDK({
        apiKey: process.env.REACT_APP_TRANSAK_API_KEY,
        environment:
          process.env.NODE_ENV === "production" ? "PRODUCTION" : "STAGING",
        defaultCryptoCurrency: "ETH",
        walletAddress: ethAddress,
        themeColor: "000000",
        fiatCurrency: "USD",
        email: emailAddress,
        // network: "ethereum",
        redirectURL: "",
        hostURL: window.location.origin,
        widgetWidth: "450px",
        widgetHeight: "635px",
      });

      transak.init();

      // To get all the events
      transak.on(transak.ALL_EVENTS, (data) => {
        console.log(data);
      });

      // This will trigger when the user marks payment is made.
      transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
        console.log(orderData);
      });

      setActionMode("buy");
      setDialog("Place an order to buy cryptocurrency.");

      return () => {
        transak.close();
      };
    }
  }, [ethAddress, emailAddress, setActionMode, setDialog]);

  return null;
});
