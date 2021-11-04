import { useEffect, memo } from "react";
import { useMoralis } from "react-moralis";
import transakSDK from "@transak/transak-sdk";

import { useExperts } from "../../contexts/expertsContext";
import { useColorMode } from "../../contexts/colorModeContext";

export const BuySell = memo(() => {
  const { setActionMode, setDialog } = useExperts();
  const { colorMode } = useColorMode();
  const { Moralis } = useMoralis();
  const user = Moralis.User.current();
  const ethAddress = user?.attributes.ethAddress;
  const emailAddress = user?.attributes.emailAddress;

  useEffect(() => {
    const transak = new transakSDK({
      apiKey:
        process.env.NODE_ENV === "production"
          ? process.env.REACT_APP_TRANSAK_PRODUCTION_API_KEY
          : process.env.REACT_APP_TRANSAK_STAGING_API_KEY,
      environment:
        process.env.NODE_ENV === "production" ? "PRODUCTION" : "STAGING",
      defaultCryptoCurrency: "USDC",
      walletAddress: ethAddress,
      themeColor: colorMode === "light" ? "D37277" : "5865C9",
      fiatCurrency: "USD",
      email: emailAddress,
      networks: "ethereum,polygon",
      defaultNetwork: "polygon",
      redirectURL: "",
      hostURL: window.location.origin,
      widgetWidth: "450px",
      widgetHeight: "635px",
    });

    transak.init();

    transak.on(transak.ALL_EVENTS, (data) => {
      console.log(data);
    });

    transak.on(transak.EVENTS.TRANSAK_WIDGET_OPEN, (data) => {
      setDialog("Place an order to buy cryptocurrency.");
    });

    transak.on(transak.EVENTS.TRANSAK_ORDER_CREATED, (data) => {
      console.log(data);
      setDialog("Transak order created");
    });

    transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data) => {
      console.log(data);
      setDialog("Transak order successful");
    });

    transak.on(transak.EVENTS.TRANSAK_ORDER_FAILED, (data) => {
      console.log(data);
      setDialog("Transak order failed");
    });

    transak.on(transak.EVENTS.TRANSAK_ORDER_CANCELLED, (data) => {
      console.log(data);
      setDialog("Transak order cancelled");
    });

    setActionMode("buy");

    return () => {
      transak.close();
    };
  }, [ethAddress, emailAddress, setActionMode, setDialog, colorMode]);

  return null;
});
