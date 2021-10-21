import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import reportWebVitals from "./components/Support/reportWebVitals";

import { MoralisProvider } from "react-moralis";
import { ExpertsProvider } from "./contexts/expertsContext";
import { ActionsProvider } from "./contexts/actionsContext";
import { QuoteProvider } from "./contexts/quoteContext";

import { ColorModeProvider } from "./contexts/colorModeContext";

// const appId = "UeAbfYO3C29W5EHdz5c5BuCItODRdOw8RcHDpAud";
// const serverUrl = "https://qvgfrpeymufw.bigmoralis.com:2053/server";

const appId = "bGqMnb18qnDTb5UCEkXKQcrzjZSKMQV8zbyNxiMC";
const serverUrl = "https://c9amlzqi9ar9.usemoralis.com:2053/server";

ReactDOM.render(
  <React.StrictMode>
    <ColorModeProvider>
      <MoralisProvider appId={appId} serverUrl={serverUrl}>
        <ExpertsProvider>
          <ActionsProvider>
            <QuoteProvider>
              <App />
            </QuoteProvider>
          </ActionsProvider>
        </ExpertsProvider>
      </MoralisProvider>
    </ColorModeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();