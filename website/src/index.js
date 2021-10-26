import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import reportWebVitals from "./components/Support/reportWebVitals";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { MoralisProvider } from "react-moralis";
import { ExpertsProvider } from "./contexts/expertsContext";
import { ActionsProvider } from "./contexts/actionsContext";
import { QuoteProvider } from "./contexts/quoteContext";
import { GradientProvider } from "./contexts/gradientsContext";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
});

// eslint-disable-next-line no-unused-vars
const dotenv = require("dotenv").config();

var appId = "";
var serverUrl = "";
console.groupCollapsed("index.js");
switch (process.env.NODE_ENV) {
  case "production":
    console.log("Executing against production mode!");
    appId = process.env.REACT_APP_MORALIS_PROD_APPLICATION_ID;
    serverUrl = process.env.REACT_APP_MORALIS_PROD_SERVER_URL;
    break;
  case "test":
    console.log("Executing against test mode.");
    appId = process.env.REACT_APP_MORALIS_TEST_APPLICATION_ID;
    serverUrl = process.env.REACT_APP_MORALIS_TEST_SERVER_URL;
    break;
  case "development":
    console.log("Executing in development mode.");
    appId = process.env.REACT_APP_MORALIS_DEV_APPLICATION_ID;
    serverUrl = process.env.REACT_APP_MORALIS_DEV_SERVER_URL;
    break;
  default:
    console.error("Unknown mode.");
}
console.groupEnd();

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <MoralisProvider appId={appId} serverUrl={serverUrl}>
        <ExpertsProvider>
          <ActionsProvider>
            <QuoteProvider>
              <GradientProvider>
                <App />
              </GradientProvider>
            </QuoteProvider>
          </ActionsProvider>
        </ExpertsProvider>
      </MoralisProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
