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

const appId = "UeAbfYO3C29W5EHdz5c5BuCItODRdOw8RcHDpAud";
const serverUrl = "https://qvgfrpeymufw.bigmoralis.com:2053/server";

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
